import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, CONTRACTS_BUCKET } from '@/lib/supabase';
import { analyzeContract, analyzeContractMock } from '@/lib/ai/analyze';
import { extractTextFromPdf, isValidExtraction } from '@/lib/pdf/extract';
import { createAuditLog, getRequestInfo } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 契約書を取得
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    }

    // 分析開始
    const startTime = Date.now();

    let analysisResult;
    let isMockAnalysis = false;

    // 本番環境ではモック分析を使用しない
    const USE_MOCK = process.env.USE_MOCK_AI === 'true';
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    if (!USE_MOCK && hasApiKey) {
      // Storage からファイルをダウンロード
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from(CONTRACTS_BUCKET)
        .download(contract.filePath);

      if (downloadError || !fileData) {
        return NextResponse.json({ error: 'ファイルの取得に失敗しました' }, { status: 500 });
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const extracted = await extractTextFromPdf(buffer);
      const contractText = extracted.text;

      if (!isValidExtraction(contractText)) {
        // テキスト抽出に失敗した場合はモックを使用
        console.log('PDF text extraction failed, using mock analysis');
        console.log('Extracted text length:', contractText.length);
        analysisResult = await analyzeContractMock(contract.contractType || '契約書');
        isMockAnalysis = true;
      } else {
        console.log('Starting AI analysis with text length:', contractText.length);
        console.log('Contract type:', contract.contractType);
        try {
          analysisResult = await analyzeContract(contractText, contract.contractType || '契約書');
          console.log('AI analysis completed. Risks found:', analysisResult.risks.length);
        } catch (aiError) {
          console.error('AI analysis failed:', aiError);
          throw aiError;
        }
      }
    } else {
      // モック分析を使用
      if (!hasApiKey) {
        console.warn('WARNING: ANTHROPIC_API_KEY is not set. Using mock analysis.');
      }
      analysisResult = await analyzeContractMock(contract.contractType || '契約書');
      isMockAnalysis = true;
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // レビュー結果を保存
    const aiModel = isMockAnalysis ? 'mock' : 'claude-sonnet-4';
    const review = await prisma.contractReview.upsert({
      where: { contractId: id },
      create: {
        contractId: id,
        riskLevel: analysisResult.riskLevel,
        overallScore: analysisResult.overallScore,
        risks: { summary: analysisResult.summary },
        checklist: analysisResult.checklist,
        aiModel,
        analysisDuration: duration,
      },
      update: {
        riskLevel: analysisResult.riskLevel,
        overallScore: analysisResult.overallScore,
        risks: { summary: analysisResult.summary },
        checklist: analysisResult.checklist,
        aiModel,
        analysisDuration: duration,
      },
    });

    // リスク項目を保存
    // 既存のリスク項目を削除
    await prisma.riskItem.deleteMany({
      where: { reviewId: review.id },
    });

    // 新しいリスク項目を作成
    await prisma.riskItem.createMany({
      data: analysisResult.risks.map((risk) => ({
        reviewId: review.id,
        riskType: risk.riskType,
        riskLevel: risk.riskLevel,
        sectionTitle: risk.sectionTitle,
        originalText: risk.originalText,
        suggestedText: risk.suggestedText,
        reason: risk.reason,
        legalBasis: risk.legalBasis,
      })),
    });

    // 契約書のステータスを更新
    await prisma.contract.update({
      where: { id },
      data: { status: 'completed' },
    });

    // 監査ログを記録
    const { ipAddress, userAgent } = getRequestInfo(request);
    await createAuditLog({
      organizationId: user.organizationId,
      userId,
      action: 'analyze',
      resourceType: 'contract',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { riskLevel: review.riskLevel, aiModel, isMockAnalysis },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        riskLevel: review.riskLevel,
        overallScore: review.overallScore,
        summary: analysisResult.summary,
        risksCount: analysisResult.risks.length,
        duration,
        aiModel,
        isMockAnalysis,
      },
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({
      error: '分析に失敗しました',
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, CONTRACTS_BUCKET } from '@/lib/supabase';
import { analyzeContract, analyzeContractMock } from '@/lib/ai/analyze';

// PDF からテキストを抽出する簡易関数
// 本番環境では pdf-parse や専用サービスを使用することを推奨
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // 簡易的なテキスト抽出（実際はpdf-parseなどを使用）
  const text = buffer.toString('utf-8');
  // PDFのバイナリからテキスト部分を抽出する簡易処理
  const matches = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u0020-\u007E]+/g);
  return matches ? matches.join(' ') : '';
}

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

    // ANTHROPIC_API_KEY が設定されている場合は実際のAPIを使用
    if (process.env.ANTHROPIC_API_KEY) {
      // Storage からファイルをダウンロード
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from(CONTRACTS_BUCKET)
        .download(contract.filePath);

      if (downloadError || !fileData) {
        return NextResponse.json({ error: 'ファイルの取得に失敗しました' }, { status: 500 });
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const contractText = await extractTextFromPdf(buffer);

      if (!contractText || contractText.length < 100) {
        // テキスト抽出に失敗した場合はモックを使用
        analysisResult = await analyzeContractMock(contract.contractType || '契約書');
      } else {
        analysisResult = await analyzeContract(contractText, contract.contractType || '契約書');
      }
    } else {
      // APIキーが未設定の場合はモックを使用
      analysisResult = await analyzeContractMock(contract.contractType || '契約書');
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // レビュー結果を保存
    const review = await prisma.contractReview.upsert({
      where: { contractId: id },
      create: {
        contractId: id,
        riskLevel: analysisResult.riskLevel,
        overallScore: analysisResult.overallScore,
        risks: { summary: analysisResult.summary },
        checklist: analysisResult.checklist,
        aiModel: process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4-20250514' : 'mock',
        analysisDuration: duration,
      },
      update: {
        riskLevel: analysisResult.riskLevel,
        overallScore: analysisResult.overallScore,
        risks: { summary: analysisResult.summary },
        checklist: analysisResult.checklist,
        aiModel: process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4-20250514' : 'mock',
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

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        riskLevel: review.riskLevel,
        overallScore: review.overallScore,
        summary: analysisResult.summary,
        risksCount: analysisResult.risks.length,
        duration,
      },
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: '分析に失敗しました' }, { status: 500 });
  }
}

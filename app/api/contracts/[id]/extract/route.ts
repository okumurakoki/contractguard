import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, CONTRACTS_BUCKET } from '@/lib/supabase';
import { extractTextFromPdf, isValidExtraction, enhancedTextProcessing } from '@/lib/pdf/extract';
import { parseContractText, structureToHtml } from '@/lib/contract/parser';
import { ContractStructure } from '@/lib/contract/types';

// PDFからテキストを抽出
export async function GET(
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

    // Storage からファイルをダウンロード
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(CONTRACTS_BUCKET)
      .download(contract.filePath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'ファイルの取得に失敗しました' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const extracted = await extractTextFromPdf(buffer);

    if (!isValidExtraction(extracted.text)) {
      return NextResponse.json({
        success: false,
        error: 'テキストを抽出できませんでした。スキャンPDFの可能性があります。',
        text: '',
        html: '',
        structuredContent: null,
        numPages: extracted.numPages,
      });
    }

    // テキストを正規化
    const processedText = enhancedTextProcessing(extracted.text);

    // 構造化データに変換
    const structuredContent: ContractStructure = parseContractText(processedText, {
      sourceFileName: contract.fileName,
      extractionMethod: extracted.extractionMethod,
      pageCount: extracted.numPages,
    });

    // 構造化データからHTMLを生成
    const html = structureToHtml(structuredContent);

    // 構造化データをDBに保存
    prisma.contract.update({
      where: { id },
      data: {
        contractTitle: structuredContent.title,
        structuredContent: structuredContent as object,
      },
    }).catch(err => {
      console.error('Failed to save structured content:', err);
    });

    return NextResponse.json({
      success: true,
      text: processedText,
      html,
      structuredContent,
      numPages: extracted.numPages,
      info: extracted.info,
      extractionMethod: extracted.extractionMethod,
    });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json({
      error: 'テキスト抽出に失敗しました',
    }, { status: 500 });
  }
}

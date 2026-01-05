import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, CONTRACTS_BUCKET } from '@/lib/supabase';
import { extractTextFromPdf, textToHtml, isValidExtraction } from '@/lib/pdf/extract';

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
        numPages: extracted.numPages,
      });
    }

    const html = textToHtml(extracted.text);

    return NextResponse.json({
      success: true,
      text: extracted.text,
      html,
      numPages: extracted.numPages,
      info: extracted.info,
    });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json({
      error: 'テキスト抽出に失敗しました',
    }, { status: 500 });
  }
}

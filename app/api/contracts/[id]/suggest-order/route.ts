import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { suggestArticleOrder, suggestArticleOrderMock } from '@/lib/ai/analyze';

const USE_MOCK = process.env.USE_MOCK_AI === 'true' || !process.env.ANTHROPIC_API_KEY;

interface ArticleInput {
  number: string;
  title: string;
}

// 条項の並び替え提案を取得
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

    // 契約書の所有権を確認
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    }

    const body = await request.json();
    const { articles } = body as { articles: ArticleInput[] };

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: '条項データが必要です' }, { status: 400 });
    }

    // AI分析を実行
    const suggestion = USE_MOCK
      ? await suggestArticleOrderMock(articles)
      : await suggestArticleOrder(articles);

    return NextResponse.json({
      success: true,
      ...suggestion,
    });
  } catch (error) {
    console.error('Suggest order error:', error);
    return NextResponse.json(
      { error: '条項の並び替え提案に失敗しました' },
      { status: 500 }
    );
  }
}

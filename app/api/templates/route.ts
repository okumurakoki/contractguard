import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // テンプレート一覧を取得
    const templates = await prisma.template.findMany({
      where: {
        isPublic: true,
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // カテゴリ一覧
    const categories = [...new Set(templates.map((t) => t.category).filter(Boolean))];

    return NextResponse.json({
      templates: templates.map((t) => ({
        id: t.id,
        name: t.title,
        category: t.category,
        description: t.description,
        format: 'Word', // テンプレートはWord形式
        downloadCount: t.usageCount,
        isFavorite: false, // TODO: ユーザーごとのお気に入り
      })),
      categories,
    });
  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json({ error: 'テンプレートの取得に失敗しました' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// テンプレート詳細取得
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

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: 'テンプレートが見つかりません' }, { status: 404 });
    }

    // 非公開テンプレートは所属組織のものだけアクセス可能
    if (!template.isPublic) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (template.organizationId !== user?.organizationId) {
        return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
      }
    }

    // variablesをパースして返す
    const variables = template.variables as Array<{
      name: string;
      label: string;
      type?: string;
      required?: boolean;
      placeholder?: string;
    }> | null;

    return NextResponse.json({
      template: {
        id: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        industry: template.industry,
        content: template.content,
        variables: variables || [],
        usageCount: template.usageCount,
        isPremium: template.isPremium,
        updatedAt: template.updatedAt,
      },
    });
  } catch (error) {
    console.error('Template detail API error:', error);
    return NextResponse.json({ error: 'テンプレートの取得に失敗しました' }, { status: 500 });
  }
}

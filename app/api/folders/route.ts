import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// フォルダ一覧取得
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const folders = await prisma.folder.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        _count: {
          select: {
            contracts: true,
            childFolders: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Get folders error:', error);
    return NextResponse.json({ error: 'フォルダ一覧の取得に失敗しました' }, { status: 500 });
  }
}

// フォルダ作成
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const body = await request.json();
    const { name, color, parentFolderId } = body;

    if (!name) {
      return NextResponse.json({ error: 'フォルダ名は必須です' }, { status: 400 });
    }

    const folder = await prisma.folder.create({
      data: {
        organizationId: user.organizationId,
        name,
        color: color || null,
        parentFolderId: parentFolderId || null,
      },
    });

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json({ error: 'フォルダの作成に失敗しました' }, { status: 500 });
  }
}

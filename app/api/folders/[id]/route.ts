import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// フォルダ詳細取得
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

    const folder = await prisma.folder.findFirst({
      where: {
        id,
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
    });

    if (!folder) {
      return NextResponse.json({ error: 'フォルダが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Get folder error:', error);
    return NextResponse.json({ error: 'フォルダの取得に失敗しました' }, { status: 500 });
  }
}

// フォルダ更新
export async function PUT(
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

    // フォルダの存在確認
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: 'フォルダが見つかりません' }, { status: 404 });
    }

    const body = await request.json();
    const { name, color } = body;

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Update folder error:', error);
    return NextResponse.json({ error: 'フォルダの更新に失敗しました' }, { status: 500 });
  }
}

// フォルダ削除
export async function DELETE(
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

    // フォルダの存在確認
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: 'フォルダが見つかりません' }, { status: 404 });
    }

    // フォルダ内の契約書のフォルダIDをnullにする
    await prisma.contract.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    // フォルダを削除
    await prisma.folder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json({ error: 'フォルダの削除に失敗しました' }, { status: 500 });
  }
}

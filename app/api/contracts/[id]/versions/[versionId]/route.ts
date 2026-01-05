import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// 特定バージョンの内容を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { userId } = await auth();
    const { id, versionId } = await params;

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

    // バージョンを取得
    const version = await prisma.contractVersion.findFirst({
      where: {
        id: versionId,
        contractId: id,
      },
    });

    if (!version) {
      return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error('Get version error:', error);
    return NextResponse.json({ error: 'バージョンの取得に失敗しました' }, { status: 500 });
  }
}

// バージョンを復元
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { userId } = await auth();
    const { id, versionId } = await params;

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
      select: {
        id: true,
        currentVersion: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    }

    // 復元対象のバージョンを取得
    const targetVersion = await prisma.contractVersion.findFirst({
      where: {
        id: versionId,
        contractId: id,
      },
    });

    if (!targetVersion) {
      return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 });
    }

    // 新しいバージョンとして復元（履歴を保持）
    const newVersionNumber = (contract.currentVersion || 0) + 1;

    await prisma.$transaction([
      prisma.contractVersion.create({
        data: {
          contractId: id,
          versionNumber: newVersionNumber,
          content: targetVersion.content,
          createdBy: userId,
          changesSummary: `バージョン ${targetVersion.versionNumber} から復元`,
        },
      }),
      prisma.contract.update({
        where: { id },
        data: {
          currentVersion: newVersionNumber,
          editedContent: targetVersion.content,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      newVersion: newVersionNumber,
    });
  } catch (error) {
    console.error('Restore version error:', error);
    return NextResponse.json({ error: 'バージョンの復元に失敗しました' }, { status: 500 });
  }
}

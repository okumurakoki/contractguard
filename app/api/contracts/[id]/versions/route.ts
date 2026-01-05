import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// バージョン一覧取得
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

    // バージョン一覧を取得
    const versions = await prisma.contractVersion.findMany({
      where: { contractId: id },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        createdAt: true,
        createdBy: true,
        changesSummary: true,
      },
    });

    return NextResponse.json({
      versions,
      currentVersion: contract.currentVersion,
    });
  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json({ error: 'バージョン一覧の取得に失敗しました' }, { status: 500 });
  }
}

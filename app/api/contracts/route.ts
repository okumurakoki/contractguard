import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// 契約書一覧取得
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contractType = searchParams.get('type');
    const folderId = searchParams.get('folderId');
    const search = searchParams.get('search');

    const contracts = await prisma.contract.findMany({
      where: {
        organizationId: user.organizationId,
        ...(status && { status }),
        ...(contractType && { contractType }),
        ...(folderId && { folderId }),
        ...(search && {
          OR: [
            { contractTitle: { contains: search, mode: 'insensitive' } },
            { fileName: { contains: search, mode: 'insensitive' } },
            { counterparty: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        review: {
          select: {
            riskLevel: true,
            overallScore: true,
            _count: {
              select: {
                riskItems: true,
              },
            },
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Get contracts error:', error);
    return NextResponse.json({ error: '契約書一覧の取得に失敗しました' }, { status: 500 });
  }
}

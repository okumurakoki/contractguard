import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// 弁護士詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await params;

    const lawyer = await prisma.lawyer.findUnique({
      where: { id },
      include: {
        availabilities: {
          where: {
            OR: [
              { specificDate: null },
              { specificDate: { gte: new Date() } },
            ],
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        reviews: {
          where: { isAnonymous: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            consultation: {
              select: {
                consultationType: true,
                completedAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            consultations: true,
            reviews: true,
          },
        },
      },
    });

    if (!lawyer) {
      return NextResponse.json(
        { error: '弁護士が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(lawyer);
  } catch (error) {
    console.error('Failed to fetch lawyer:', error);
    return NextResponse.json(
      { error: '弁護士情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

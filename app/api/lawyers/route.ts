import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// 弁護士一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const specialization = searchParams.get('specialization');
    const minRating = searchParams.get('minRating');
    const maxFee = searchParams.get('maxFee');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // フィルター条件を構築
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (specialization) {
      where.specializations = { has: specialization };
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    if (maxFee) {
      where.consultationFee = { lte: parseInt(maxFee) };
    }

    // 弁護士一覧を取得
    const [lawyers, total] = await Promise.all([
      prisma.lawyer.findMany({
        where,
        orderBy: [
          { isVerified: 'desc' },
          { rating: 'desc' },
          { reviewCount: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { consultations: true },
          },
        },
      }),
      prisma.lawyer.count({ where }),
    ]);

    return NextResponse.json({
      lawyers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch lawyers:', error);
    return NextResponse.json(
      { error: '弁護士一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

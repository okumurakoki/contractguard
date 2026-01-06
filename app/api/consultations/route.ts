import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// 相談予約一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    const consultations = await prisma.lawyerConsultation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        lawyer: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            specializations: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractTitle: true,
            contractType: true,
          },
        },
      },
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error('Failed to fetch consultations:', error);
    return NextResponse.json(
      { error: '相談履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新規相談予約を作成
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const body = await request.json();
    const {
      lawyerId,
      contractId,
      consultationType,
      scheduledAt,
      requestDetails,
    } = body;

    // 弁護士の存在確認
    const lawyer = await prisma.lawyer.findUnique({
      where: { id: lawyerId },
    });

    if (!lawyer || !lawyer.isActive) {
      return NextResponse.json(
        { error: '指定された弁護士は現在利用できません' },
        { status: 400 }
      );
    }

    // 予約日時の重複チェック
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      const existingConsultation = await prisma.lawyerConsultation.findFirst({
        where: {
          lawyerId,
          scheduledAt: scheduledDate,
          status: { in: ['pending', 'confirmed'] },
        },
      });

      if (existingConsultation) {
        return NextResponse.json(
          { error: 'この時間帯は既に予約されています' },
          { status: 400 }
        );
      }
    }

    // 相談予約を作成
    const consultation = await prisma.lawyerConsultation.create({
      data: {
        organizationId: user.organizationId,
        requestedBy: userId,
        lawyerId,
        contractId: contractId || null,
        consultationType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        requestDetails,
        estimatedFee: lawyer.consultationFee,
        status: 'pending',
      },
      include: {
        lawyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(consultation, { status: 201 });
  } catch (error) {
    console.error('Failed to create consultation:', error);
    return NextResponse.json(
      { error: '相談予約の作成に失敗しました' },
      { status: 500 }
    );
  }
}

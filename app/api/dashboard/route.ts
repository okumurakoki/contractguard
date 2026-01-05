import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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

    const organizationId = user.organizationId;

    // 契約書総数
    const totalContracts = await prisma.contract.count({
      where: { organizationId },
    });

    // 今月のレビュー数
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyReviews = await prisma.contractReview.count({
      where: {
        contract: { organizationId },
        createdAt: { gte: startOfMonth },
      },
    });

    // 高リスク契約数
    const highRiskContracts = await prisma.contract.count({
      where: {
        organizationId,
        review: {
          riskLevel: 'high',
        },
      },
    });

    // 30日以内に期限切れの契約
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const expiringContracts = await prisma.contract.count({
      where: {
        organizationId,
        expiryDate: {
          lte: thirtyDaysLater,
          gte: new Date(),
        },
      },
    });

    // 要注意契約（高・中リスク、最新5件）
    const attentionContracts = await prisma.contract.findMany({
      where: {
        organizationId,
        review: {
          riskLevel: { in: ['high', 'medium'] },
        },
      },
      include: {
        review: {
          include: {
            riskItems: true,
          },
        },
      },
      orderBy: [
        { review: { riskLevel: 'desc' } },
        { createdAt: 'desc' },
      ],
      take: 4,
    });

    // 最近の契約書（最新5件）
    const recentContracts = await prisma.contract.findMany({
      where: { organizationId },
      include: {
        review: {
          select: {
            riskLevel: true,
            overallScore: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // プラン情報（組織から取得）
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        planType: true,
      },
    });

    // プランタイプに基づく月間レビュー上限
    const planLimits: Record<string, number> = {
      lite: 10,
      standard: 50,
      premium: 200,
      enterprise: 9999,
    };

    const planType = organization?.planType || 'lite';
    const monthlyLimit = planLimits[planType] || 10;

    return NextResponse.json({
      stats: {
        totalContracts,
        monthlyReviews,
        highRiskContracts,
        expiringContracts,
      },
      attentionContracts: attentionContracts.map((contract) => ({
        id: contract.id,
        title: contract.contractTitle || contract.fileName,
        counterparty: contract.counterparty,
        contractType: contract.contractType,
        expiryDate: contract.expiryDate,
        riskLevel: contract.review?.riskLevel || 'low',
        riskCount: contract.review?.riskItems?.length || 0,
      })),
      recentContracts: recentContracts.map((contract) => ({
        id: contract.id,
        title: contract.contractTitle || contract.fileName,
        contractType: contract.contractType,
        status: contract.status,
        riskLevel: contract.review?.riskLevel,
        createdAt: contract.createdAt,
      })),
      plan: {
        name: planType,
        monthlyLimit,
        monthlyUsed: monthlyReviews,
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'ダッシュボードデータの取得に失敗しました' }, { status: 500 });
  }
}

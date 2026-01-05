import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession, createCustomer, PLANS, PlanType } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();
    const { planType } = body;

    if (!planType || !PLANS[planType as PlanType]) {
      return NextResponse.json({ error: '無効なプランです' }, { status: 400 });
    }

    const organization = user.organization;
    let customerId = organization.stripeCustomerId;

    // Stripeカスタマーを作成（まだ存在しない場合）
    if (!customerId) {
      const customer = await createCustomer({
        email: user.email,
        name: organization.name,
        organizationId: organization.id,
      });
      customerId = customer.id;

      // 組織にStripeカスタマーIDを保存
      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await createCheckoutSession({
      organizationId: organization.id,
      planType: planType as PlanType,
      successUrl: `${appUrl}/settings/billing?success=true`,
      cancelUrl: `${appUrl}/settings/billing?canceled=true`,
      customerId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'チェックアウトセッションの作成に失敗しました' },
      { status: 500 }
    );
  }
}

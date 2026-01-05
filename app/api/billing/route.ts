import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getInvoices, getPaymentMethods, getSubscription } from '@/lib/stripe';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const organization = user.organization;
    const customerId = organization.stripeCustomerId;
    const subscriptionId = organization.stripeSubscriptionId;

    let subscription = null;
    let paymentMethods: Array<{
      id: string;
      brand: string;
      last4: string;
      expiryMonth: number;
      expiryYear: number;
      isDefault: boolean;
    }> = [];
    let invoices: Array<{
      id: string;
      date: string;
      amount: number;
      status: string;
      description: string;
      invoiceUrl: string;
    }> = [];

    if (customerId) {
      try {
        // 支払い方法を取得
        const stripePaymentMethods = await getPaymentMethods(customerId);
        paymentMethods = stripePaymentMethods.map((pm) => ({
          id: pm.id,
          brand: pm.card?.brand || 'unknown',
          last4: pm.card?.last4 || '****',
          expiryMonth: pm.card?.exp_month || 0,
          expiryYear: pm.card?.exp_year || 0,
          isDefault: false, // TODO: デフォルト支払い方法の判定
        }));

        // 請求書を取得
        const stripeInvoices = await getInvoices(customerId);
        invoices = stripeInvoices.map((inv) => ({
          id: inv.id,
          date: new Date((inv.created || 0) * 1000).toLocaleDateString('ja-JP'),
          amount: (inv.amount_paid || 0) / 100,
          status: inv.status === 'paid' ? 'paid' : inv.status === 'open' ? 'pending' : 'failed',
          description: inv.lines.data[0]?.description || 'サブスクリプション料金',
          invoiceUrl: inv.hosted_invoice_url || '',
        }));
      } catch (e) {
        console.error('Error fetching Stripe data:', e);
      }
    }

    if (subscriptionId) {
      try {
        const stripeSubscription = await getSubscription(subscriptionId);
        const periodEnd = (stripeSubscription as { current_period_end?: number }).current_period_end;
        subscription = {
          status: stripeSubscription.status,
          currentPeriodEnd: new Date((periodEnd || 0) * 1000).toISOString(),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        };
      } catch (e) {
        console.error('Error fetching subscription:', e);
      }
    }

    return NextResponse.json({
      planType: organization.planType,
      subscription,
      paymentMethods,
      invoices,
      trialEndsAt: organization.trialEndsAt,
    });
  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json({ error: '請求情報の取得に失敗しました' }, { status: 500 });
  }
}

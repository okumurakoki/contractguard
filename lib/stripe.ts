import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// プラン設定
export const PLANS = {
  lite: {
    name: 'Liteプラン',
    priceId: process.env.STRIPE_PRICE_LITE || null,
    price: 0,
    limits: {
      contracts: 10,
      storage: '1GB',
      users: 1,
      aiAnalysis: 10,
    },
  },
  standard: {
    name: 'Standardプラン',
    priceId: process.env.STRIPE_PRICE_STANDARD || null,
    price: 9800,
    limits: {
      contracts: 100,
      storage: '10GB',
      users: 3,
      aiAnalysis: 100,
    },
  },
  premium: {
    name: 'Premiumプラン',
    priceId: process.env.STRIPE_PRICE_PREMIUM || null,
    price: 29800,
    limits: {
      contracts: -1, // unlimited
      storage: '100GB',
      users: -1, // unlimited
      aiAnalysis: -1, // unlimited
    },
  },
  enterprise: {
    name: 'Enterpriseプラン',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || null,
    price: 98000,
    limits: {
      contracts: -1,
      storage: '1TB',
      users: -1,
      aiAnalysis: -1,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

// Checkout Session作成
export async function createCheckoutSession({
  organizationId,
  planType,
  successUrl,
  cancelUrl,
  customerId,
}: {
  organizationId: string;
  planType: PlanType;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
}) {
  const plan = PLANS[planType];

  if (!plan.priceId) {
    throw new Error(`Price ID not configured for plan: ${planType}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer: customerId,
    metadata: {
      organizationId,
      planType,
    },
    subscription_data: {
      metadata: {
        organizationId,
        planType,
      },
    },
  });

  return session;
}

// Customer Portalセッション作成
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// 顧客を作成
export async function createCustomer({
  email,
  name,
  organizationId,
}: {
  email: string;
  name: string;
  organizationId: string;
}) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      organizationId,
    },
  });

  return customer;
}

// サブスクリプションの取得
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

// 請求書一覧の取得
export async function getInvoices(customerId: string, limit = 10) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });
  return invoices.data;
}

// 支払い方法の取得
export async function getPaymentMethods(customerId: string) {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  return paymentMethods.data;
}

// Webhook署名の検証
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

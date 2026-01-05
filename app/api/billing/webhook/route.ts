import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { constructWebhookEvent, PlanType, PLANS } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        const planType = session.metadata?.planType as PlanType;

        if (organizationId && planType) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              planType,
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: 'active',
            },
          });

          console.log(`Organization ${organizationId} upgraded to ${planType}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;

        if (organizationId) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscriptionStatus: subscription.status,
            },
          });

          console.log(`Subscription updated for organization ${organizationId}: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;

        if (organizationId) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              planType: 'lite',
              stripeSubscriptionId: null,
              subscriptionStatus: 'canceled',
            },
          });

          console.log(`Subscription canceled for organization ${organizationId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // 顧客に紐づく組織を検索
        const organization = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (organization) {
          await prisma.organization.update({
            where: { id: organization.id },
            data: {
              subscriptionStatus: 'past_due',
            },
          });

          console.log(`Payment failed for organization ${organization.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

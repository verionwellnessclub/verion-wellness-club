import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Stripe → Developers → Webhooks → Add endpoint
 *   URL:     https://verionwellnessclub.com/api/stripe/webhook
 *   Eventos: checkout.session.completed
 *            customer.subscription.created
 *            customer.subscription.updated
 *            customer.subscription.deleted
 */
export async function POST(req: Request) {
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get('stripe-signature')!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }
  const db = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.mode === 'subscription' && s.subscription) {
        const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription.id;
        await syncSubscription(db, await stripe.subscriptions.retrieve(subId));
      } else if (s.mode === 'payment' && s.payment_status === 'paid') {
        await fulfillOrder(db, s.metadata?.order_id, s.metadata?.user_id);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscription(db, event.data.object as Stripe.Subscription);
      break;
  }
  return NextResponse.json({ received: true });
}

type DB = ReturnType<typeof createServiceClient>;

async function syncSubscription(db: DB, sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id;
  if (!userId) return;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  // Según la versión de la API, el fin de periodo viene en la suscripción o en su primer item
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const itemEnd = (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end;
  const end = legacy ?? itemEnd;

  await db.from('subscriptions').upsert(
    {
      user_id: userId,
      plan_id: sub.metadata?.plan_id || null,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      status: sub.status,
      current_period_end: end ? new Date(end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  );
  await db.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
}

async function fulfillOrder(db: DB, orderId?: string, userId?: string) {
  if (!orderId || !userId) return;
  const { data: order } = await db.from('orders').select('id, status, items').eq('id', orderId).single();
  if (!order || order.status !== 'pendiente') return; // ya procesada

  const items = order.items as { kind: string; challenge_id?: string | null; event_id?: string | null }[];
  // Inscripciones y boletos no se recogen en recepción
  const nothingToPickUp = items.every((i) => i.kind === 'challenge' || i.kind === 'event');
  await db.from('orders').update({ status: nothingToPickUp ? 'entregada' : 'pagada' }).eq('id', orderId);

  for (const it of items) {
    if (it.kind === 'challenge' && it.challenge_id) {
      await db.from('challenge_entries').upsert({ challenge_id: it.challenge_id, user_id: userId, paid: true });
    }
    if (it.kind === 'event' && it.event_id) {
      // Si se llenó mientras pagaba, el trigger lo rechaza: el staff lo ve en Admin y reembolsa
      await db.from('event_tickets').upsert({ event_id: it.event_id, user_id: userId, paid: true, status: 'confirmado' }, { onConflict: 'event_id,user_id' });
    }
  }
}

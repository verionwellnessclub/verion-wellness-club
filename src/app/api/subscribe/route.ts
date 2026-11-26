import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/access';
import { stripe } from '@/lib/stripe';

/** Crea la suscripción mensual (Stripe Checkout en modo "subscription"). */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Inicia sesión' }, { status: 401 });

  const { planId } = (await req.json().catch(() => ({}))) as { planId?: string };
  const { data: plan } = await supabase.from('plans').select('*').eq('id', planId ?? '').eq('active', true).maybeSingle();
  if (!plan) return NextResponse.json({ error: 'Plan no disponible' }, { status: 400 });

  const sub = await getSubscription(supabase, user.id);
  if (sub.active) return NextResponse.json({ error: 'Ya tienes una suscripción activa. Adminístrala desde tu perfil.' }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: user.email }),
    client_reference_id: user.id,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'mxn',
        unit_amount: plan.price_mxn * 100,
        recurring: { interval: 'month' },
        product_data: { name: `Verion Wellness Club · ${plan.name}` },
      },
    }],
    subscription_data: { metadata: { user_id: user.id, plan_id: plan.id } },
    metadata: { user_id: user.id, plan_id: plan.id },
    success_url: `${site}/app/club?ok=1`,
    cancel_url: `${site}/app/club`,
    locale: 'es-419',
    allow_promotion_codes: true,
  });
  return NextResponse.json({ url: session.url });
}

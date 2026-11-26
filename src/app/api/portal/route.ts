import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/access';
import { stripe } from '@/lib/stripe';

/** Portal de Stripe para cambiar tarjeta, ver facturas o cancelar. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Inicia sesión' }, { status: 401 });
  const sub = await getSubscription(supabase, user.id);
  if (!sub.customerId) return NextResponse.json({ error: 'No encontramos tu suscripción' }, { status: 400 });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const portal = await stripe.billingPortal.sessions.create({ customer: sub.customerId, return_url: `${site}/app/club` });
  return NextResponse.json({ url: portal.url });
}

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

type Item = { id: string; qty: number };
type Line = { id: string; name: string; price_mxn: number; qty: number; kind: string; challenge_id?: string | null; event_id?: string | null };

/** Pago único: productos de la tienda, inscripción a retos o boleto de evento. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Inicia sesión' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { items?: Item[]; event_id?: string } | null;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  let lines: Line[] = [];
  let back = '/app/tienda';

  if (body?.event_id) {
    // ---- Boleto de evento ----
    const { data: ev } = await supabase.from('events').select('id, slug, title, price_mxn, capacity, published, starts_at')
      .eq('id', body.event_id).maybeSingle();
    if (!ev || !ev.published || ev.price_mxn <= 0) return NextResponse.json({ error: 'Evento no disponible' }, { status: 400 });
    if (new Date(ev.starts_at).getTime() < Date.now()) return NextResponse.json({ error: 'El evento ya pasó' }, { status: 400 });
    const { data: has } = await supabase.from('event_tickets').select('id').eq('event_id', ev.id).eq('user_id', user.id).neq('status', 'cancelado').maybeSingle();
    if (has) return NextResponse.json({ error: 'Ya tienes boleto' }, { status: 400 });
    if (ev.capacity) {
      const { data: taken } = await supabase.rpc('event_spots_taken', { p_event: ev.id });
      if ((taken as number) >= ev.capacity) return NextResponse.json({ error: 'Evento lleno' }, { status: 400 });
    }
    lines = [{ id: ev.id, name: `Boleto: ${ev.title}`, price_mxn: ev.price_mxn, qty: 1, kind: 'event', event_id: ev.id }];
    back = `/app/eventos/${ev.slug}`;
  } else {
    // ---- Tienda / retos ----
    const wanted = (body?.items ?? []).filter((i) => i && typeof i.id === 'string' && Number(i.qty) > 0).slice(0, 20);
    if (!wanted.length) return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });
    const { data: products } = await supabase.from('products').select('id, name, price_mxn, kind, challenge_id')
      .in('id', wanted.map((i) => i.id)).eq('active', true);
    if (!products?.length) return NextResponse.json({ error: 'Productos no disponibles' }, { status: 400 });
    lines = products.map((p) => ({
      ...p,
      qty: p.kind === 'challenge' ? 1 : Math.min(10, Math.floor(wanted.find((w) => w.id === p.id)!.qty)),
    }));
    for (const l of lines.filter((l) => l.kind === 'challenge')) {
      const { data: already } = await supabase.from('challenge_entries').select('user_id')
        .eq('challenge_id', l.challenge_id!).eq('user_id', user.id).maybeSingle();
      if (already) return NextResponse.json({ error: 'Ya estás inscrito en este reto' }, { status: 400 });
    }
    if (lines.some((l) => l.kind === 'challenge')) back = '/app/retos';
  }

  const total = lines.reduce((s, l) => s + l.price_mxn * l.qty, 0);
  const admin = createServiceClient();
  const { data: order, error: oErr } = await admin
    .from('orders')
    .insert({ user_id: user.id, total_mxn: total, items: lines.map((l) => ({ ...l, price: l.price_mxn })) })
    .select('id')
    .single();
  if (oErr || !order) return NextResponse.json({ error: 'No se pudo crear la orden' }, { status: 500 });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    client_reference_id: order.id,
    metadata: { order_id: order.id, user_id: user.id },
    line_items: lines.map((l) => ({
      quantity: l.qty,
      price_data: { currency: 'mxn', unit_amount: l.price_mxn * 100, product_data: { name: l.name } },
    })),
    success_url: `${site}${back}?pagado=1`,
    cancel_url: `${site}${back}?cancelado=1`,
    locale: 'es-419',
  });

  await admin.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);
  return NextResponse.json({ url: session.url });
}

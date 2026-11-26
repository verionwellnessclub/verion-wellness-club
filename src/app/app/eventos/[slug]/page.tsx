import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { getSessionProfile } from '@/lib/supabase/server';
import { EVENT_KINDS } from '@/config/site';
import { fmtDateTime, mxn, type EventRow } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { CheckoutButton } from '@/components/CheckoutButton';
import { rsvpEvent } from '../../actions';

export default async function EventoApp({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ pagado?: string }> }) {
  const { slug } = await params;
  const { pagado } = await searchParams;
  const { supabase, user } = await getSessionProfile();
  const { data } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
  if (!data) notFound();
  const e = data as EventRow;

  const [{ data: ticket }, { data: taken }] = await Promise.all([
    supabase.from('event_tickets').select('code, status').eq('event_id', e.id).eq('user_id', user!.id).neq('status', 'cancelado').maybeSingle(),
    supabase.rpc('event_spots_taken', { p_event: e.id }),
  ]);
  const left = e.capacity ? Math.max(0, e.capacity - ((taken as number) ?? 0)) : null;
  const past = new Date(e.starts_at).getTime() < Date.now() - 6 * 3600e3;
  const qr = ticket ? await QRCode.toDataURL(ticket.code, { margin: 1, width: 360 }) : null;

  return (
    <main className="page">
      <Link href="/app/eventos" className="sub">← Eventos</Link>
      <div style={{ fontSize: 44, marginTop: 12 }}>{e.emoji}</div>
      <div className="hello">{e.title}</div>
      <div className="sub">{EVENT_KINDS[e.kind]}{e.partner_name ? ` · con ${e.partner_name}` : ''}</div>

      <div className="card">
        <div className="rule"><span>Cuándo</span><span>{fmtDateTime(e.starts_at)}</span></div>
        <div className="rule"><span>Dónde</span><span>{e.location}</span></div>
        <div className="rule"><span>Precio</span><span>{e.price_mxn ? mxn(e.price_mxn) : 'Gratis'}</span></div>
        {left !== null && <div className="rule"><span>Lugares disponibles</span><span>{left}</span></div>}
      </div>

      {e.description && <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{e.description}</p>}

      {ticket ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <span className={`tag ${ticket.status === 'asistio' ? 'dark' : 'ok'}`}>{ticket.status === 'asistio' ? 'Asististe ✓' : 'Tu boleto'}</span>
          {qr && <img src={qr} alt={`Código ${ticket.code}`} style={{ width: '70%', maxWidth: 260, borderRadius: 12, margin: '14px auto 6px', display: 'block' }} />}
          <div className="code" style={{ margin: '8px auto 0', maxWidth: 220 }}>{ticket.code}</div>
          <p className="sub" style={{ fontSize: 12, marginTop: 8 }}>Muéstralo al llegar.</p>
        </div>
      ) : past ? (
        <div className="card empty">Este evento ya pasó.</div>
      ) : left === 0 ? (
        <div className="card empty">Evento lleno 😢</div>
      ) : pagado ? (
        <div className="msg ok">✅ Pago recibido. Tu boleto aparece aquí en unos segundos; recarga la página.</div>
      ) : e.price_mxn ? (
        <div style={{ marginTop: 14 }}><CheckoutButton eventId={e.id} label={`Comprar boleto · ${mxn(e.price_mxn)}`} /></div>
      ) : (
        <ActionForm action={rsvpEvent} className="card" resetOnSuccess={false}>
          <input type="hidden" name="event_id" value={e.id} />
          <Submit>Apartar mi lugar</Submit>
        </ActionForm>
      )}
    </main>
  );
}

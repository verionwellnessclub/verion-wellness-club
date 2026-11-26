import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { EVENT_KINDS } from '@/config/site';
import { fmtDateTime, mxn, type EventRow } from '@/lib/data';

export default async function EventosApp() {
  const { supabase, user } = await getSessionProfile();
  const [{ data: events }, { data: tickets }] = await Promise.all([
    supabase.from('events').select('*').eq('published', true).gte('starts_at', new Date(Date.now() - 6 * 3600e3).toISOString()).order('starts_at'),
    supabase.from('event_tickets').select('event_id, status').eq('user_id', user!.id).neq('status', 'cancelado'),
  ]);
  const mine = new Set((tickets ?? []).map((t) => t.event_id));

  return (
    <main className="page">
      <div className="hello">Eventos</div>
      <div className="sub">Runs con café, eventos con marcas, workshops y retos.</div>
      {(events ?? []).length === 0 && <div className="card empty">Muy pronto anunciamos el siguiente evento.</div>}
      {((events ?? []) as EventRow[]).map((e) => (
        <Link key={e.id} href={`/app/eventos/${e.slug}`} className="card" style={{ display: 'block' }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ fontSize: 30 }}>{e.emoji}</div>
            <div style={{ flex: 1 }}>
              <span className="edate" style={{ fontSize: 13 }}>{fmtDateTime(e.starts_at)}</span>
              <b style={{ display: 'block', fontSize: 16, marginTop: 2 }}>{e.title}</b>
              <div className="sub" style={{ fontSize: 12, marginTop: 2 }}>{EVENT_KINDS[e.kind]}{e.partner_name ? ` · con ${e.partner_name}` : ''} · {e.location}</div>
            </div>
            {mine.has(e.id) ? <span className="tag ok">Tienes lugar</span> : <b>{e.price_mxn ? mxn(e.price_mxn) : 'Gratis'}</b>}
          </div>
        </Link>
      ))}
      <Link href="/noticias" className="card between" style={{ display: 'flex' }}>
        <div><b>📰 Noticias y alianzas</b><div className="sub" style={{ fontSize: 12 }}>Afiliaciones, marcas aliadas y novedades</div></div>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>→</span>
      </Link>
    </main>
  );
}

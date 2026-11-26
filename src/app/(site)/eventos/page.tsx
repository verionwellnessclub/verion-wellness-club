import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { EVENT_KINDS } from '@/config/site';
import { fmtDateTime, mxn, type EventRow } from '@/lib/data';

export const metadata: Metadata = { title: 'Eventos' };
export const revalidate = 300;

export default async function Eventos() {
  const supabase = await createClient();
  const { data } = await supabase.from('events').select('*').eq('published', true)
    .gte('starts_at', new Date(Date.now() - 864e5).toISOString()).order('starts_at');
  const events = (data ?? []) as EventRow[];

  return (
    <main>
      <section className="shero">
        <div className="glow" />
        <div className="wrap">
          <div className="kicker">Eventos Verion</div>
          <h1>Entrenar es mejor<br /><em>en comunidad.</em></h1>
          <p>Runs con café, eventos con marcas aliadas, workshops y retos. Aparta tu lugar desde la app.</p>
        </div>
      </section>
      <section className="ssec">
        <div className="wrap">
          {events.length === 0 && <p className="lead">Pronto anunciamos los próximos eventos.</p>}
          <div className="sgrid">
            {events.map((e) => (
              <Link key={e.id} href={`/eventos/${e.slug}`} className="scard">
                <span className="ico">{e.emoji}</span>
                <span className="edate">{fmtDateTime(e.starts_at)}</span>
                <h3>{e.title}</h3>
                {e.partner_name && <p>Con <b style={{ color: 'var(--text)' }}>{e.partner_name}</b></p>}
                <p>{e.location}</p>
                <div className="row" style={{ marginTop: 'auto' }}>
                  <span className="tag dark">{EVENT_KINDS[e.kind]}</span>
                  <b style={{ marginLeft: 'auto' }}>{e.price_mxn ? mxn(e.price_mxn) : 'Gratis'}</b>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

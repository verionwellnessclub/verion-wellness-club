import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EVENT_KINDS } from '@/config/site';
import { fmtDateTime, mxn, type EventRow } from '@/lib/data';

type P = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('events').select('*').eq('slug', slug).eq('published', true).maybeSingle();
  if (!data) return null;
  const { data: taken } = await supabase.rpc('event_spots_taken', { p_event: data.id });
  return { e: data as EventRow, taken: (taken as number) ?? 0 };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const r = await load((await params).slug);
  return r ? { title: r.e.title, description: r.e.description ?? undefined } : {};
}

export default async function Evento({ params }: P) {
  const r = await load((await params).slug);
  if (!r) notFound();
  const { e, taken } = r;
  const left = e.capacity ? Math.max(0, e.capacity - taken) : null;

  return (
    <main>
      <section className="shero">
        <div className="glow" />
        <div className="wrap">
          <div className="kicker">{EVENT_KINDS[e.kind]}{e.partner_name ? ` · con ${e.partner_name}` : ''}</div>
          <h1 style={{ fontSize: 'clamp(40px,7vw,80px)' }}>{e.emoji} {e.title}</h1>
          <p><b style={{ color: 'var(--text)' }}>{fmtDateTime(e.starts_at)}</b> · {e.location}</p>
          <div className="btnrow">
            <Link href={`/app/eventos/${e.slug}`} className="btn pri">
              {left === 0 ? 'Evento lleno' : e.price_mxn ? `Comprar boleto · ${mxn(e.price_mxn)}` : 'Apartar mi lugar gratis'}
            </Link>
            {left !== null && left > 0 && <span className="tag dark" style={{ alignSelf: 'center' }}>Quedan {left} lugares</span>}
          </div>
        </div>
      </section>
      {e.description && (
        <section className="ssec"><div className="wrap"><div className="prose">{e.description}</div></div></section>
      )}
    </main>
  );
}

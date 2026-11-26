import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NEWS_KINDS } from '@/config/site';
import { fmtDate } from '@/lib/data';

type P = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('news').select('*').eq('slug', slug).eq('published', true).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const n = await load((await params).slug);
  return n ? { title: n.title, description: n.summary ?? undefined } : {};
}

export default async function Noticia({ params }: P) {
  const n = await load((await params).slug);
  if (!n) notFound();
  return (
    <main>
      <section className="shero">
        <div className="wrap">
          <div className="kicker">{NEWS_KINDS[n.kind]} · {fmtDate(n.published_at)}</div>
          <h1 style={{ fontSize: 'clamp(36px,6vw,68px)' }}>{n.emoji} {n.title}</h1>
          {n.summary && <p>{n.summary}</p>}
        </div>
      </section>
      <section className="ssec">
        <div className="wrap">
          <div className="prose">{n.body}</div>
          {n.partner_url && (
            <a href={n.partner_url} target="_blank" rel="noreferrer" className="btn ghost sm" style={{ marginTop: 24 }}>
              Conoce a {n.partner_name ?? 'nuestro aliado'} ↗
            </a>
          )}
        </div>
      </section>
    </main>
  );
}

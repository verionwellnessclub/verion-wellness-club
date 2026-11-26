import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NEWS_KINDS } from '@/config/site';
import { fmtDate } from '@/lib/data';

export const metadata: Metadata = { title: 'Noticias y alianzas' };
export const revalidate = 300;

export default async function Noticias() {
  const supabase = await createClient();
  const { data } = await supabase.from('news').select('slug, title, kind, summary, emoji, partner_name, published_at')
    .eq('published', true).order('published_at', { ascending: false });

  return (
    <main>
      <section className="shero">
        <div className="glow" />
        <div className="wrap">
          <div className="kicker">Noticias</div>
          <h1>Lo nuevo en <em>Verion.</em></h1>
          <p>Afiliaciones, alianzas con marcas y novedades del club.</p>
        </div>
      </section>
      <section className="ssec">
        <div className="wrap">
          <div className="sgrid">
            {(data ?? []).map((n) => (
              <Link key={n.slug} href={`/noticias/${n.slug}`} className="scard">
                <span className="ico">{n.emoji}</span>
                <div className="row"><span className="tag dark">{NEWS_KINDS[n.kind]}</span><small className="sub" style={{ fontSize: 12 }}>{fmtDate(n.published_at)}</small></div>
                <h3>{n.title}</h3>
                <p>{n.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

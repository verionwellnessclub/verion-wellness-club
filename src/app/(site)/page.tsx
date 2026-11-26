import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SITE, EVENT_KINDS, NEWS_KINDS } from '@/config/site';
import { fmtDateTime, mxn, type EventRow } from '@/lib/data';
import { PlanCards } from '@/components/PlanCards';

export const revalidate = 300;

const SERVICES = [
  { ico: '🏋️', t: 'Clases en Verion', d: 'Fuerza y resistencia en formato funcional de 32 minutos, con coach y en grupos pequeños.', href: SITE.bookingUrl, cta: 'Reservar' },
  { ico: '📱', t: 'Entrenamiento online', d: 'Programas con video de cada ejercicio para entrenar donde estés.', href: '/club', cta: 'Ver planes' },
  { ico: '🎯', t: 'Coaching personalizado', d: 'Un coach arma tu plan a tu medida y te da seguimiento por chat.', href: '/club', cta: 'Empezar' },
  { ico: '🤝', t: '1:1 presencial', d: 'Sesiones personales en el estudio. Preparación Hyrox, técnica y metas específicas.', href: '/app/wellness?c=pt', cta: 'Agendar' },
  { ico: '🥗', t: 'Nutrición y fisio', d: 'Profesionales aliados con precio especial para miembros del club.', href: '/app/wellness', cta: 'Conocer' },
  { ico: '☕', t: 'Eventos y comunidad', d: 'Runs con café, eventos con marcas, retos y workshops.', href: '/eventos', cta: 'Ver eventos' },
];

export default async function Home() {
  const supabase = await createClient();
  const [{ data: plans }, { data: events }, { data: news }, { data: products }] = await Promise.all([
    supabase.from('plans').select('*').eq('active', true).order('sort'),
    supabase.from('events').select('*').eq('published', true).gte('starts_at', new Date().toISOString()).order('starts_at').limit(3),
    supabase.from('news').select('slug, title, kind, summary, emoji, published_at').eq('published', true).order('published_at', { ascending: false }).limit(3),
    supabase.from('products').select('id, name, emoji, price_mxn').eq('active', true).neq('kind', 'challenge').order('sort').limit(4),
  ]);

  return (
    <main>
      <section className="shero">
        <div className="glow" />
        <div className="wrap">
          <div className="kicker">{SITE.name} · {SITE.city}</div>
          <h1>Entrena.<br />Recupérate.<br /><em>Pertenece.</em></h1>
          <p>Clases funcionales, entrenamiento online, coaching personalizado, nutrición, fisio y una comunidad que te empuja. Todo en un solo club.</p>
          <div className="btnrow">
            <Link href="/club" className="btn pri">Únete al club online</Link>
            <a href={SITE.bookingUrl} className="btn ghost">Reservar una clase</a>
          </div>
        </div>
      </section>

      <section className="ssec" id="servicios">
        <div className="wrap">
          <div className="kicker">Todo tu wellness</div>
          <h2>Un club, todo lo que necesitas.</h2>
          <div className="sgrid">
            {SERVICES.map((s) => (
              <a key={s.t} href={s.href} className="scard">
                <span className="ico">{s.ico}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14, marginTop: 'auto' }}>{s.cta} →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="ssec" id="club">
        <div className="wrap">
          <div className="kicker">Club Online</div>
          <h2>Entrena con Verion desde donde estés.</h2>
          <p className="lead">Suscripción mensual, cancela cuando quieras. Si ya entrenas en el estudio, complementa tus clases con programas para los días que no vienes.</p>
          <PlanCards plans={plans ?? []} />
        </div>
      </section>

      <section className="ssec">
        <div className="wrap">
          <div className="between" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div><div className="kicker">Próximos eventos</div><h2>Lo que viene.</h2></div>
            <Link href="/eventos" className="btn ghost sm">Ver todos</Link>
          </div>
          <div className="sgrid">
            {(events as EventRow[] | null)?.length ? (events as EventRow[]).map((e) => (
              <Link key={e.id} href={`/eventos/${e.slug}`} className="scard">
                <span className="ico">{e.emoji}</span>
                <span className="edate">{fmtDateTime(e.starts_at)}</span>
                <h3>{e.title}</h3>
                <p>{e.description}</p>
                <div className="row" style={{ marginTop: 'auto' }}>
                  <span className="tag dark">{EVENT_KINDS[e.kind]}</span>
                  <b style={{ marginLeft: 'auto' }}>{e.price_mxn ? mxn(e.price_mxn) : 'Gratis'}</b>
                </div>
              </Link>
            )) : <p className="lead">Muy pronto anunciamos los próximos eventos. Síguenos en Instagram.</p>}
          </div>
        </div>
      </section>

      <section className="ssec" id="tienda">
        <div className="wrap">
          <div className="kicker">Tienda oficial</div>
          <h2>Merch y productos Verion.</h2>
          <p className="lead">Compra desde la app y recoge en el estudio después de clase.</p>
          <div className="sgrid">
            {(products ?? []).map((p) => (
              <Link key={p.id} href="/app/tienda" className="scard" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontSize: 46 }}>{p.emoji}</span>
                <h3 style={{ fontSize: 17 }}>{p.name}</h3>
                <b className="disp" style={{ fontSize: 20 }}>{mxn(p.price_mxn)}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {(news ?? []).length > 0 && (
        <section className="ssec">
          <div className="wrap">
            <div className="between" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div><div className="kicker">Noticias y alianzas</div><h2>Lo nuevo en Verion.</h2></div>
              <Link href="/noticias" className="btn ghost sm">Ver todas</Link>
            </div>
            <div className="sgrid">
              {(news ?? []).map((n) => (
                <Link key={n.slug} href={`/noticias/${n.slug}`} className="scard">
                  <span className="ico">{n.emoji}</span>
                  <span className="tag dark" style={{ alignSelf: 'flex-start' }}>{NEWS_KINDS[n.kind]}</span>
                  <h3>{n.title}</h3>
                  <p>{n.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="ssec">
        <div className="wrap">
          <div className="bigcta">
            <h2>Tu primera semana empieza hoy.</h2>
            <p style={{ marginTop: 12, opacity: 0.9, fontSize: 17, maxWidth: 560 }}>Crea tu cuenta gratis para unirte a la comunidad, comprar en la tienda y apartar tu lugar en los eventos.</p>
            <div className="btnrow">
              <Link href="/login" className="btn white">Crear mi cuenta</Link>
              <a href={SITE.bookingUrl} className="btn" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>Reservar clase</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

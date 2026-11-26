import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/access';
import { getActiveChallenge, getLeaderboard, shortName, timeAgo, fmtDateTime } from '@/lib/data';
import { SITE } from '@/config/site';
import { ActionForm, Submit } from '@/components/ActionForm';
import { CopyButton } from '@/components/CopyButton';
import { createPost } from './actions';

export default async function Home() {
  const { supabase, user, profile } = await getSessionProfile();
  const uid = user!.id;
  const [sub, challenge, { data: feed }, { data: referred }, { data: nextEvent }, { data: lastLog }] = await Promise.all([
    getSubscription(supabase, uid),
    getActiveChallenge(supabase),
    supabase.from('feed').select('*').limit(15),
    supabase.rpc('my_referral_count'),
    supabase.from('events').select('slug, title, starts_at, emoji').eq('published', true)
      .gte('starts_at', new Date().toISOString()).order('starts_at').limit(1).maybeSingle(),
    supabase.from('workout_logs').select('completed_at').eq('user_id', uid).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const board = challenge ? await getLeaderboard(supabase, challenge.id) : [];
  const myIdx = board.findIndex((r) => r.user_id === uid);

  const first = (profile?.full_name ?? '').split(' ')[0] || 'crack';
  const refLink = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/login?ref=${profile?.referral_code ?? ''}`;

  return (
    <main className="page">
      <div className="hello">Hola, {first} 👋</div>
      <div className="sub">{sub.active ? `Miembro ${sub.planName}` : 'Bienvenida/o a Verion Wellness Club'}</div>

      {sub.active ? (
        <div className="card hero">
          <span className="tag">Entrenamiento online</span>
          <div className="big" style={{ margin: '12px 0 6px', fontSize: 28 }}>¿Entrenamos hoy?</div>
          <div style={{ opacity: 0.9, fontSize: 14 }}>
            {lastLog ? `Tu última sesión fue ${timeAgo(lastLog.completed_at)}.` : 'Empieza tu primer programa.'}
          </div>
          <Link href="/app/entrenar" className="btn white sm" style={{ marginTop: 14 }}>Ir a mis entrenamientos</Link>
        </div>
      ) : (
        <div className="card hero">
          <span className="tag">Club Online</span>
          <div className="big" style={{ margin: '12px 0 6px', fontSize: 28 }}>Entrena con Verion donde estés</div>
          <div style={{ opacity: 0.9, fontSize: 14 }}>Programas con video, plan personalizado y coach por chat.</div>
          <Link href="/app/club" className="btn white sm" style={{ marginTop: 14 }}>Ver planes</Link>
        </div>
      )}

      <div className="grid2">
        <a href={SITE.bookingUrl} className="card" style={{ marginTop: 0 }}>
          <div style={{ fontSize: 26 }}>🗓️</div>
          <b style={{ display: 'block', marginTop: 8 }}>Reservar clase</b>
          <small className="sub" style={{ fontSize: 12 }}>En el estudio</small>
        </a>
        <Link href={nextEvent ? `/app/eventos/${nextEvent.slug}` : '/app/eventos'} className="card" style={{ marginTop: 0 }}>
          <div style={{ fontSize: 26 }}>{nextEvent?.emoji ?? '📍'}</div>
          <b style={{ display: 'block', marginTop: 8 }}>{nextEvent?.title ?? 'Eventos'}</b>
          <small className="sub" style={{ fontSize: 12 }}>{nextEvent ? fmtDateTime(nextEvent.starts_at) : 'Próximamente'}</small>
        </Link>
      </div>

      {challenge && (
        <Link href="/app/retos" className="card" style={{ display: 'block' }}>
          <div className="between">
            <div>
              <span className="tag warn">Reto</span>
              <h3 style={{ marginTop: 10 }}>{challenge.name} 🔥</h3>
              <p className="sub" style={{ marginTop: 4 }}>
                {myIdx >= 0 ? `Vas en el lugar #${myIdx + 1} con ${board[myIdx].points} pts` : 'Inscríbete y gana hasta una anualidad'}
              </p>
            </div>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>→</span>
          </div>
        </Link>
      )}

      <div className="card">
        <div className="between">
          <div>
            <span className="tag ok">Embajadores</span>
            <h3 style={{ marginTop: 10, fontSize: 19 }}>Trae a tu gente, gana 15%</h3>
          </div>
          <div style={{ fontSize: 34 }}>🤝</div>
        </div>
        <p className="sub" style={{ marginTop: 6 }}>Por cada paquete que compre alguien con tu código, recibes 15% en tu mensualidad o en efectivo.</p>
        <div className="code">{profile?.referral_code}</div>
        <div className="between">
          <div className="sub">Registrados con tu código: <b style={{ color: 'var(--text)' }}>{(referred as number) ?? 0}</b></div>
          <CopyButton text={refLink} label="Compartir" />
        </div>
      </div>

      <div className="sec"><h3>Comunidad</h3></div>
      <ActionForm action={createPost} className="card">
        <textarea name="body" rows={2} maxLength={500} placeholder="Comparte tu PR, tu racha o motiva a alguien…" />
        <div style={{ marginTop: 8, textAlign: 'right' }}><Submit className="btn pri sm">Publicar</Submit></div>
      </ActionForm>
      <div className="card list" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {(feed ?? []).length === 0 && <div className="empty">Sé la primera persona en publicar 💪</div>}
        {(feed ?? []).map((p) => (
          <div key={p.id}>
            <b style={{ fontSize: 14 }}>{shortName(p.full_name)}</b>
            {p.role !== 'member' && <span className="tag ok" style={{ marginLeft: 6 }}>Coach</span>}
            <span className="sub" style={{ fontSize: 12 }}> · {timeAgo(p.created_at)}</span>
            <p style={{ fontSize: 14, marginTop: 4, lineHeight: 1.4 }}>{p.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

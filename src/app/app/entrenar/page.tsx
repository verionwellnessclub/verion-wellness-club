import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/access';
import { timeAgo } from '@/lib/data';

type Program = { id: string; title: string; description: string | null; level: string; goal: string | null; weeks: number; emoji: string | null; assigned_to: string | null };

function ProgramCard({ p, personal }: { p: Program; personal?: boolean }) {
  return (
    <Link href={`/app/entrenar/${p.id}`} className="card" style={{ display: 'block' }}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 26, background: 'rgba(255,90,31,.1)', flex: 'none' }}>{p.emoji}</div>
        <div style={{ flex: 1 }}>
          {personal && <span className="tag ok" style={{ marginBottom: 6 }}>Tu plan personalizado</span>}
          <b style={{ display: 'block', fontSize: 16 }}>{p.title}</b>
          <div className="sub" style={{ fontSize: 12, marginTop: 2 }}>{p.weeks} semanas · {p.level}{p.goal ? ` · ${p.goal}` : ''}</div>
          {p.description && <p className="sub" style={{ fontSize: 13, marginTop: 6 }}>{p.description}</p>}
        </div>
      </div>
    </Link>
  );
}

export default async function Entrenar() {
  const { supabase, user } = await getSessionProfile();
  const uid = user!.id;
  const [sub, { data: programs }, { data: logs }] = await Promise.all([
    getSubscription(supabase, uid),
    supabase.from('programs').select('id, title, description, level, goal, weeks, emoji, assigned_to').order('created_at', { ascending: false }),
    supabase.from('workout_logs').select('id, completed_at, workouts(title, programs(title))').eq('user_id', uid).order('completed_at', { ascending: false }).limit(5),
  ]);
  const all = (programs ?? []) as Program[];
  const mine = all.filter((p) => p.assigned_to === uid);
  const catalog = all.filter((p) => !p.assigned_to);

  return (
    <main className="page">
      <div className="hello">Entrenar</div>
      <div className="sub">Programas online, tu plan personal y tu progreso.</div>

      {!sub.active && (
        <div className="card hero">
          <span className="tag">Club Online</span>
          <div className="big" style={{ margin: '12px 0 6px', fontSize: 26 }}>Desbloquea todos los programas</div>
          <div style={{ opacity: 0.9, fontSize: 14 }}>Videos de cada ejercicio, seguimiento y, si quieres, un coach que arma tu plan.</div>
          <Link href="/app/club" className="btn white sm" style={{ marginTop: 14 }}>Ver planes</Link>
        </div>
      )}

      <div className="grid2">
        <Link href="/app/progreso" className="card" style={{ marginTop: 0 }}>
          <div style={{ fontSize: 24 }}>📈</div><b style={{ display: 'block', marginTop: 6 }}>Mi progreso</b>
          <small className="sub" style={{ fontSize: 12 }}>PRs y constancia</small>
        </Link>
        <Link href={sub.coaching ? '/app/coach' : '/app/club'} className="card" style={{ marginTop: 0 }}>
          <div style={{ fontSize: 24 }}>💬</div><b style={{ display: 'block', marginTop: 6 }}>Mi coach</b>
          <small className="sub" style={{ fontSize: 12 }}>{sub.coaching ? 'Chat directo' : 'Incluido en Coaching'}</small>
        </Link>
      </div>

      {mine.length > 0 && (
        <>
          <div className="sec"><h3>Tu plan</h3></div>
          {mine.map((p) => <ProgramCard key={p.id} p={p} personal />)}
        </>
      )}
      {sub.coaching && mine.length === 0 && (
        <div className="card">
          <b>Tu coach está armando tu plan 🛠️</b>
          <p className="sub" style={{ marginTop: 6 }}>Cuéntale tus objetivos, lesiones y días disponibles por el <Link href="/app/coach" style={{ color: 'var(--accent)' }}>chat</Link>.</p>
        </div>
      )}

      <div className="sec"><h3>Programas</h3></div>
      {catalog.length === 0 && <div className="card empty">Pronto publicamos los primeros programas.</div>}
      {catalog.map((p) => <ProgramCard key={p.id} p={p} />)}

      {(logs ?? []).length > 0 && (
        <>
          <div className="sec"><h3>Últimas sesiones</h3></div>
          <div className="card list" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {(logs ?? []).map((l) => {
              const w = l.workouts as unknown as { title: string; programs: { title: string } | null } | null;
              return (
                <div key={l.id} className="between">
                  <div><b style={{ fontSize: 14 }}>{w?.title}</b><br /><small className="sub" style={{ fontSize: 12 }}>{w?.programs?.title}</small></div>
                  <small className="sub" style={{ fontSize: 12 }}>{timeAgo(l.completed_at)}</small>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

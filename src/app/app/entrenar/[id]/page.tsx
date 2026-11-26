import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionProfile } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/access';

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getSessionProfile();
  const { data: program } = await supabase.from('programs').select('*').eq('id', id).maybeSingle();
  if (!program) notFound();

  const [sub, { data: workouts }, { data: logs }] = await Promise.all([
    getSubscription(supabase, user!.id),
    supabase.from('workouts').select('id, week, day, title, minutes').eq('program_id', id).order('week').order('day'),
    supabase.from('workout_logs').select('workout_id').eq('user_id', user!.id),
  ]);
  const done = new Set((logs ?? []).map((l) => l.workout_id));
  const weeks = new Map<number, NonNullable<typeof workouts>>();
  (workouts ?? []).forEach((w) => weeks.set(w.week, [...(weeks.get(w.week) ?? []), w]));
  const total = (workouts ?? []).length;
  const completed = (workouts ?? []).filter((w) => done.has(w.id)).length;

  return (
    <main className="page">
      <Link href="/app/entrenar" className="sub">← Entrenar</Link>
      <div className="hello" style={{ marginTop: 10 }}>{program.emoji} {program.title}</div>
      <div className="sub">{program.weeks} semanas · {program.level}{program.goal ? ` · ${program.goal}` : ''}</div>
      {program.description && <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.5 }}>{program.description}</p>}

      {!sub.active ? (
        <div className="card hero">
          <div className="big" style={{ fontSize: 24 }}>Este programa es parte del Club Online</div>
          <Link href="/app/club" className="btn white sm" style={{ marginTop: 14 }}>Ver planes</Link>
        </div>
      ) : (
        <>
          {total > 0 && (
            <div className="card">
              <div className="between"><b>Avance</b><span className="sub">{completed} / {total} sesiones</span></div>
              <div style={{ height: 8, background: 'var(--panel2)', borderRadius: 9, marginTop: 10 }}>
                <div style={{ width: `${(completed / total) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 9 }} />
              </div>
            </div>
          )}
          {total === 0 && <div className="card empty">Las sesiones de este programa se están cargando.</div>}
          {[...weeks.entries()].map(([wk, list]) => (
            <div key={wk}>
              <div className="sec"><h3>Semana {wk}</h3></div>
              <div className="card list" style={{ paddingTop: 4, paddingBottom: 4 }}>
                {list.map((w) => (
                  <Link key={w.id} href={`/app/entrenar/sesion/${w.id}`} className="between">
                    <div>
                      <b style={{ fontSize: 15 }}>Día {w.day} · {w.title}</b>
                      {w.minutes && <div className="sub" style={{ fontSize: 12 }}>{w.minutes} min</div>}
                    </div>
                    {done.has(w.id) ? <span className="tag ok">Hecho</span> : <span style={{ color: 'var(--accent)', fontWeight: 700 }}>→</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </main>
  );
}

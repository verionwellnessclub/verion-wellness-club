import { getSessionProfile } from '@/lib/supabase/server';
import { ActionForm, Submit } from '@/components/ActionForm';
import { addPR } from '../actions';

const EXERCISES = ['Sentadilla', 'Peso muerto', 'Press de banca', 'Hip thrust', 'Remo con mancuerna', 'Swing KB', 'Empuje de trineo', 'Dominadas', 'Press militar'];

export default async function Progreso() {
  const { supabase, user } = await getSessionProfile();

  const since = new Date();
  since.setDate(since.getDate() - 7 * 8);
  const [{ data: prs }, { data: classes }, { data: online }] = await Promise.all([
    supabase.from('prs').select('*').eq('user_id', user!.id).order('performed_on', { ascending: false }).limit(50),
    supabase
      .from('points_log')
      .select('day, challenge_actions!inner(code)')
      .eq('user_id', user!.id)
      .eq('challenge_actions.code', 'clase')
      .gte('day', since.toISOString().slice(0, 10)),
    supabase.from('workout_logs').select('completed_at').eq('user_id', user!.id).gte('completed_at', since.toISOString()),
  ]);
  const checkins = [
    ...(classes ?? []).map((c) => ({ day: c.day as string })),
    ...(online ?? []).map((o) => ({ day: (o.completed_at as string).slice(0, 10) })),
  ];

  // Asistencias por semana (últimas 8)
  const weeks = Array.from({ length: 8 }, () => 0);
  checkins.forEach((c) => {
    const ago = Math.floor((Date.now() - new Date(c.day + 'T12:00:00').getTime()) / (7 * 864e5));
    if (ago >= 0 && ago < 8) weeks[7 - ago]++;
  });
  const max = Math.max(4, ...weeks);

  // Mejor marca por ejercicio
  const best = new Map<string, { weight_kg: number; reps: number; performed_on: string }>();
  (prs ?? []).forEach((p) => {
    const cur = best.get(p.exercise);
    if (!cur || Number(p.weight_kg) > Number(cur.weight_kg)) best.set(p.exercise, p);
  });

  return (
    <main className="page">
      <div className="hello">Tu progreso</div>
      <div className="sub">Clases en el estudio + sesiones online, y tus PRs.</div>

      <div className="card">
        <div className="between"><h3 style={{ fontSize: 17 }}>Entrenamientos por semana</h3><span className="tag dark">Últimas 8</span></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110, marginTop: 14 }}>
          {weeks.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{v || ''}</span>
              <i style={{ width: '100%', height: `${Math.max(4, (v / max) * 80)}%`, borderRadius: '8px 8px 4px 4px', background: i === 7 ? 'var(--accent)' : 'var(--panel2)' }} />
              <small style={{ fontSize: 11, color: 'var(--muted)' }}>{i === 7 ? 'Esta' : `-${7 - i}`}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="sec"><h3>Registrar PR</h3></div>
      <ActionForm action={addPR} className="card">
        <div className="field">
          <label>Ejercicio</label>
          <select name="exercise">{EXERCISES.map((e) => <option key={e}>{e}</option>)}</select>
        </div>
        <div className="f3">
          <div className="field"><label>Peso (kg)</label><input name="weight_kg" type="number" step="0.5" inputMode="decimal" placeholder="60" required /></div>
          <div className="field"><label>Reps</label><input name="reps" type="number" inputMode="numeric" placeholder="5" required /></div>
          <div className="field"><label>&nbsp;</label><Submit className="btn pri" style={{ padding: '12px 0' }}>Guardar</Submit></div>
        </div>
      </ActionForm>

      <div className="sec"><h3>Mejores marcas</h3></div>
      <div className="card list" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {best.size === 0 && <div className="empty">Registra tu primer PR 🏋️</div>}
        {[...best.entries()].map(([ex, p]) => (
          <div key={ex} className="between">
            <div><b style={{ fontSize: 15 }}>{ex}</b><br /><small className="sub" style={{ fontSize: 12 }}>{new Date(p.performed_on + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</small></div>
            <div style={{ textAlign: 'right' }}>
              <span className="disp" style={{ fontWeight: 800, fontSize: 20 }}>{Number(p.weight_kg)} kg</span><br />
              <small className="sub" style={{ fontSize: 12 }}>× {p.reps} reps</small>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

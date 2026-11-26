import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionProfile } from '@/lib/supabase/server';
import { signVideos } from '@/lib/access';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ActionForm, Submit } from '@/components/ActionForm';
import { completeWorkout } from '../../../actions';

type Item = {
  id: string; sets: number | null; reps: string | null; rest_sec: number | null; notes: string | null; sort: number;
  exercises: { name: string; description: string | null; video_path: string | null; video_url: string | null; equipment: string | null } | null;
};

export default async function Sesion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getSessionProfile();
  // La RLS sólo devuelve el entrenamiento si la suscripción está activa
  const { data: workout } = await supabase.from('workouts').select('*, programs(id, title)').eq('id', id).maybeSingle();
  if (!workout) notFound();

  const [{ data: items }, { count: times }] = await Promise.all([
    supabase.from('workout_items')
      .select('id, sets, reps, rest_sec, notes, sort, exercises(name, description, video_path, video_url, equipment)')
      .eq('workout_id', id).order('sort'),
    supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('workout_id', id).eq('user_id', user!.id),
  ]);
  const list = (items ?? []) as unknown as Item[];
  const urls = await signVideos(list.map((i) => i.exercises?.video_path ?? ''));
  const program = workout.programs as { id: string; title: string } | null;

  return (
    <main className="page">
      <Link href={`/app/entrenar/${program?.id}`} className="sub">← {program?.title}</Link>
      <div className="hello" style={{ marginTop: 10 }}>{workout.title}</div>
      <div className="sub">Semana {workout.week} · Día {workout.day}{workout.minutes ? ` · ${workout.minutes} min` : ''}{times ? ` · completada ${times}×` : ''}</div>
      {workout.notes && <div className="card" style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{workout.notes}</div>}

      {list.map((it, i) => (
        <div key={it.id} className="card">
          <div className="between" style={{ alignItems: 'flex-start' }}>
            <div>
              <span className="sub" style={{ fontSize: 12, fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</span>
              <h3 style={{ fontSize: 18 }}>{it.exercises?.name}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <b className="disp" style={{ fontSize: 20 }}>{it.sets ? `${it.sets} × ` : ''}{it.reps}</b>
              {it.rest_sec ? <div className="sub" style={{ fontSize: 12 }}>Descanso {it.rest_sec}s</div> : null}
            </div>
          </div>
          <VideoPlayer src={it.exercises?.video_path ? urls[it.exercises.video_path] : null} url={it.exercises?.video_url} title={it.exercises?.name ?? ''} />
          {(it.notes || it.exercises?.description) && (
            <p className="sub" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>{it.notes || it.exercises?.description}</p>
          )}
        </div>
      ))}

      <div className="sec"><h3>¿Terminaste?</h3></div>
      <ActionForm action={completeWorkout} className="card">
        <input type="hidden" name="workout_id" value={id} />
        <div className="field">
          <label>¿Qué tan pesada se sintió? (1 = muy fácil, 10 = al límite)</label>
          <select name="rpe" defaultValue="7">{Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select>
        </div>
        <div className="field"><label>Notas para tu coach (opcional)</label><input name="notes" maxLength={500} placeholder="Subí peso en sentadilla…" /></div>
        <Submit>Marcar como completada</Submit>
      </ActionForm>
    </main>
  );
}

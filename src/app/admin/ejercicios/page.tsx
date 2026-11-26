import { getSessionProfile } from '@/lib/supabase/server';
import { signVideos } from '@/lib/access';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ExerciseForm } from './ExerciseForm';
import { deleteExercise } from '../actions';

export default async function Ejercicios({ searchParams }: { searchParams: Promise<{ q?: string; ver?: string }> }) {
  const { q, ver } = await searchParams;
  const { supabase } = await getSessionProfile();
  let query = supabase.from('exercises').select('*').order('name');
  if (q) query = query.ilike('name', `%${q}%`);
  const { data: list } = await query;
  const preview = (list ?? []).find((e) => e.id === ver);
  const urls = preview?.video_path ? await signVideos([preview.video_path]) : {};

  return (
    <main>
      <h1>Ejercicios y videos</h1>
      <p className="sub">Tu biblioteca. Cada ejercicio con su video se usa para armar programas y planes personalizados.</p>
      <div className="cols">
        <div><ExerciseForm /></div>
        <div>
          <form className="card inline">
            <div className="field" style={{ margin: 0 }}><input name="q" defaultValue={q} placeholder="Buscar ejercicio…" /></div>
            <button className="btn ghost sm">Buscar</button>
          </form>
          {preview && (
            <div className="card">
              <b>{preview.name}</b>
              <VideoPlayer src={preview.video_path ? urls[preview.video_path] : null} url={preview.video_url} title={preview.name} />
            </div>
          )}
          <div className="card">
            <table className="adm">
              <thead><tr><th>Ejercicio</th><th>Grupo</th><th>Video</th><th /></tr></thead>
              <tbody>
                {(list ?? []).map((e) => (
                  <tr key={e.id}>
                    <td><b>{e.name}</b>{e.equipment && <div className="sub" style={{ fontSize: 12 }}>{e.equipment}</div>}</td>
                    <td>{e.muscle_group}</td>
                    <td>{e.video_path || e.video_url ? <a href={`?ver=${e.id}${q ? `&q=${q}` : ''}`} style={{ color: 'var(--accent)' }}>▶ Ver</a> : <span className="sub">—</span>}</td>
                    <td>
                      <form action={deleteExercise}><input type="hidden" name="id" value={e.id} /><button className="btn ghost sm" title="Eliminar (si no está en ningún programa)">✕</button></form>
                    </td>
                  </tr>
                ))}
                {(list ?? []).length === 0 && <tr><td colSpan={4} className="empty">Aún no hay ejercicios. Sube el primero.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionProfile } from '@/lib/supabase/server';
import { ActionForm, Submit } from '@/components/ActionForm';
import { addItem, addWorkout, copyProgramTo, deleteItem, deleteProgram, deleteWorkout, updateProgram } from '../../actions';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado', 'Todos'];

type Item = { id: string; sets: number | null; reps: string | null; rest_sec: number | null; notes: string | null; sort: number; exercises: { name: string } | null };
type Workout = { id: string; week: number; day: number; title: string; minutes: number | null; notes: string | null; workout_items: Item[] };

export default async function EditProgram({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSessionProfile();
  const [{ data: p }, { data: wks }, { data: exercises }] = await Promise.all([
    supabase.from('programs').select('*, profiles!programs_assigned_to_fkey(full_name, email)').eq('id', id).maybeSingle(),
    supabase.from('workouts').select('id, week, day, title, minutes, notes, workout_items(id, sets, reps, rest_sec, notes, sort, exercises(name))')
      .eq('program_id', id).order('week').order('day'),
    supabase.from('exercises').select('id, name').order('name'),
  ]);
  if (!p) notFound();
  const client = p.profiles as { full_name: string; email: string } | null;
  const workouts = (wks ?? []) as unknown as Workout[];

  return (
    <main>
      <Link href="/admin/programas" className="sub">← Programas</Link>
      <h1 style={{ marginTop: 8 }}>{p.emoji} {p.title}</h1>
      <p className="sub">{client ? `Plan personalizado de ${client.full_name} (${client.email})` : 'Programa del catálogo'}</p>

      <div className="cols">
        <div>
          <ActionForm action={updateProgram} className="card" resetOnSuccess={false}>
            <input type="hidden" name="id" value={p.id} />
            <div className="inline">
              <div className="field" style={{ maxWidth: 80 }}><label>Emoji</label><input name="emoji" defaultValue={p.emoji ?? ''} /></div>
              <div className="field"><label>Título</label><input name="title" defaultValue={p.title} /></div>
            </div>
            <div className="inline">
              <div className="field"><label>Nivel</label><select name="level" defaultValue={p.level}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
              <div className="field"><label>Semanas</label><input name="weeks" type="number" defaultValue={p.weeks} /></div>
              <div className="field"><label>Objetivo</label><input name="goal" defaultValue={p.goal ?? ''} /></div>
            </div>
            <div className="field"><label>Descripción</label><textarea name="description" rows={2} defaultValue={p.description ?? ''} /></div>
            <label className="row" style={{ fontSize: 14, marginBottom: 10 }}><input type="checkbox" name="published" defaultChecked={p.published} style={{ width: 'auto' }} /> Publicado (visible para {client ? 'el cliente' : 'suscriptores'})</label>
            <Submit>Guardar cambios</Submit>
          </ActionForm>

          <ActionForm action={addWorkout} className="card">
            <b>Agregar sesión</b>
            <input type="hidden" name="program_id" value={p.id} />
            <div className="inline" style={{ marginTop: 10 }}>
              <div className="field"><label>Semana</label><input name="week" type="number" min={1} defaultValue={1} /></div>
              <div className="field"><label>Día</label><input name="day" type="number" min={1} max={7} defaultValue={workouts.length + 1} /></div>
              <div className="field"><label>Minutos</label><input name="minutes" type="number" placeholder="40" /></div>
            </div>
            <div className="field"><label>Título</label><input name="title" placeholder="Pierna y core" required /></div>
            <div className="field"><label>Calentamiento / indicaciones</label><textarea name="notes" rows={2} /></div>
            <Submit>Agregar sesión</Submit>
          </ActionForm>

          {!client && (
            <ActionForm action={copyProgramTo} className="card">
              <b>Usar como base para un plan personalizado</b>
              <p className="sub" style={{ fontSize: 13, margin: '6px 0 10px' }}>Copia este programa completo a un cliente y luego ajústalo.</p>
              <input type="hidden" name="program_id" value={p.id} />
              <div className="inline">
                <div className="field" style={{ margin: 0 }}><input name="email" type="email" required placeholder="correo del cliente" /></div>
                <Submit className="btn pri sm">Copiar</Submit>
              </div>
            </ActionForm>
          )}

          <form action={deleteProgram} style={{ marginTop: 14 }}>
            <input type="hidden" name="id" value={p.id} />
            <button className="btn ghost sm">Eliminar programa</button>
          </form>
        </div>

        <div>
          {workouts.length === 0 && <div className="card empty">Agrega la primera sesión ←</div>}
          {exercises?.length === 0 && <div className="msg err">Primero sube ejercicios en “Ejercicios y videos”.</div>}
          {workouts.map((w) => (
            <div key={w.id} className="card">
              <div className="between">
                <b>S{w.week} · D{w.day} — {w.title}{w.minutes ? ` (${w.minutes} min)` : ''}</b>
                <form action={deleteWorkout}>
                  <input type="hidden" name="id" value={w.id} /><input type="hidden" name="program_id" value={p.id} />
                  <button className="btn ghost sm" title="Eliminar sesión">✕</button>
                </form>
              </div>
              <table className="adm" style={{ marginTop: 6 }}>
                <tbody>
                  {[...w.workout_items].sort((a, b) => a.sort - b.sort).map((it) => (
                    <tr key={it.id}>
                      <td>{it.exercises?.name}{it.notes && <div className="sub" style={{ fontSize: 12 }}>{it.notes}</div>}</td>
                      <td>{it.sets ? `${it.sets}×` : ''}{it.reps}</td>
                      <td>{it.rest_sec ? `${it.rest_sec}s` : ''}</td>
                      <td>
                        <form action={deleteItem}>
                          <input type="hidden" name="id" value={it.id} /><input type="hidden" name="program_id" value={p.id} />
                          <button className="btn ghost sm">✕</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ActionForm action={addItem}>
                <input type="hidden" name="workout_id" value={w.id} /><input type="hidden" name="program_id" value={p.id} />
                <div className="inline" style={{ marginTop: 10 }}>
                  <div className="field" style={{ minWidth: 180 }}><label>Ejercicio</label>
                    <select name="exercise_id" required>{(exercises ?? []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
                  </div>
                  <div className="field" style={{ maxWidth: 70 }}><label>Series</label><input name="sets" type="number" min={1} placeholder="3" /></div>
                  <div className="field" style={{ maxWidth: 90 }}><label>Reps</label><input name="reps" placeholder="10-12" /></div>
                  <div className="field" style={{ maxWidth: 90 }}><label>Desc. (s)</label><input name="rest_sec" type="number" placeholder="60" /></div>
                </div>
                <div className="inline">
                  <div className="field" style={{ margin: 0 }}><input name="notes" placeholder="Nota (opcional): tempo 3-1-1, peso moderado…" /></div>
                  <Submit className="btn pri sm">+ Agregar</Submit>
                </div>
              </ActionForm>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

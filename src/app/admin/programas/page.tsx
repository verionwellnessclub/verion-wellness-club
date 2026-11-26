import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { ActionForm, Submit } from '@/components/ActionForm';
import { createProgram, togglePublished } from '../actions';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado', 'Todos'];

export default async function Programas() {
  const { supabase } = await getSessionProfile();
  const { data: programs } = await supabase.from('programs')
    .select('id, title, level, weeks, emoji, published, assigned_to, profiles!programs_assigned_to_fkey(full_name), workouts(count)')
    .order('created_at', { ascending: false });
  const catalog = (programs ?? []).filter((p) => !p.assigned_to);
  const personal = (programs ?? []).filter((p) => p.assigned_to);
  const count = (p: { workouts: unknown }) => (p.workouts as { count: number }[])?.[0]?.count ?? 0;

  return (
    <main>
      <h1>Programas</h1>
      <p className="sub">Programas del catálogo (para todos los suscriptores) y planes personalizados (para un cliente).</p>
      <div className="cols">
        <ActionForm action={createProgram} className="card">
          <b>Nuevo programa</b>
          <div className="inline" style={{ marginTop: 10 }}>
            <div className="field" style={{ maxWidth: 80 }}><label>Emoji</label><input name="emoji" defaultValue="🏋️" /></div>
            <div className="field"><label>Título *</label><input name="title" required placeholder="Glúteo y pierna · 6 semanas" /></div>
          </div>
          <div className="inline">
            <div className="field"><label>Nivel</label><select name="level">{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
            <div className="field"><label>Semanas</label><input name="weeks" type="number" min={1} max={52} defaultValue={4} /></div>
            <div className="field"><label>Objetivo</label><input name="goal" placeholder="Hipertrofia" /></div>
          </div>
          <div className="field"><label>Descripción</label><textarea name="description" rows={2} /></div>
          <div className="field"><label>Plan personalizado para (correo del cliente, opcional)</label><input name="assign_email" type="email" placeholder="Déjalo vacío para el catálogo" /></div>
          <Submit>Crear y agregar sesiones</Submit>
        </ActionForm>

        <div>
          <div className="card">
            <b>Catálogo</b>
            <table className="adm" style={{ marginTop: 8 }}>
              <tbody>
                {catalog.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/admin/programas/${p.id}`}><b>{p.emoji} {p.title}</b></Link><div className="sub" style={{ fontSize: 12 }}>{p.level} · {p.weeks} sem · {count(p)} sesiones</div></td>
                    <td style={{ textAlign: 'right' }}>
                      <form action={togglePublished}>
                        <input type="hidden" name="table" value="programs" /><input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="value" value={String(!p.published)} />
                        <button className={`tag ${p.published ? 'ok' : 'dark'}`} style={{ border: 0, cursor: 'pointer' }}>{p.published ? 'Publicado' : 'Borrador'}</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {catalog.length === 0 && <tr><td className="empty">Sin programas aún</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="card">
            <b>Planes personalizados</b>
            <table className="adm" style={{ marginTop: 8 }}>
              <tbody>
                {personal.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/admin/programas/${p.id}`}><b>{p.emoji} {p.title}</b></Link><div className="sub" style={{ fontSize: 12 }}>{count(p)} sesiones</div></td>
                    <td>{(p.profiles as unknown as { full_name: string } | null)?.full_name}</td>
                  </tr>
                ))}
                {personal.length === 0 && <tr><td className="empty">Sin planes personalizados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

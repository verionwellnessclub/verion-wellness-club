import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionProfile } from '@/lib/supabase/server';
import { fmtDateTime } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { createProgram, staffReply } from '../../actions';

export default async function Cliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSessionProfile();
  const [{ data: client }, { data: msgs }, { data: programs }, { data: logs }, { data: prs }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').eq('id', id).maybeSingle(),
    supabase.from('coach_messages').select('id, author_id, body, created_at').eq('client_id', id).order('created_at').limit(300),
    supabase.from('programs').select('id, title, emoji').eq('assigned_to', id),
    supabase.from('workout_logs').select('id, completed_at, rpe, notes, workouts(title)').eq('user_id', id).order('completed_at', { ascending: false }).limit(15),
    supabase.from('prs').select('exercise, weight_kg, reps, performed_on').eq('user_id', id).order('performed_on', { ascending: false }).limit(10),
  ]);
  if (!client) notFound();

  return (
    <main>
      <Link href="/admin/clientes" className="sub">← Clientes</Link>
      <h1 style={{ marginTop: 8 }}>{client.full_name}</h1>
      <p className="sub">{client.email}</p>

      <div className="cols">
        <div>
          <div className="card">
            <b>Chat</b>
            <div className="thread" style={{ marginTop: 10 }}>
              {(msgs ?? []).length === 0 && <div className="empty">Sin mensajes. Escríbele para arrancar: objetivos, lesiones, días disponibles.</div>}
              {(msgs ?? []).map((m) => (
                <div key={m.id} className={`bubble ${m.author_id !== id ? 'mine' : ''}`}>
                  {m.body}<small>{m.author_id === id ? client.full_name : 'Coach'} · {fmtDateTime(m.created_at)}</small>
                </div>
              ))}
            </div>
          </div>
          <ActionForm action={staffReply} className="card">
            <input type="hidden" name="client_id" value={id} />
            <textarea name="body" rows={3} required placeholder="Responder…" />
            <div style={{ marginTop: 8, textAlign: 'right' }}><Submit className="btn pri sm">Enviar</Submit></div>
          </ActionForm>
        </div>

        <div>
          <div className="card">
            <b>Plan personalizado</b>
            {(programs ?? []).map((p) => (
              <Link key={p.id} href={`/admin/programas/${p.id}`} className="between" style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <span>{p.emoji} {p.title}</span><span style={{ color: 'var(--accent)' }}>Editar →</span>
              </Link>
            ))}
            <ActionForm action={createProgram} resetOnSuccess={false}>
              <input type="hidden" name="assign_email" value={client.email ?? ''} />
              <input type="hidden" name="weeks" value="4" />
              <div className="inline" style={{ marginTop: 10 }}>
                <div className="field" style={{ margin: 0 }}><input name="title" required placeholder={`Plan de ${client.full_name?.split(' ')[0] ?? 'cliente'} · Mes 1`} /></div>
                <Submit className="btn pri sm">Crear plan desde cero</Submit>
              </div>
            </ActionForm>
            <p className="sub" style={{ fontSize: 12, marginTop: 8 }}>¿Quieres partir de un programa existente? Ábrelo en Programas y usa “Copiar a cliente”.</p>
          </div>

          <div className="card">
            <b>Últimas sesiones</b>
            <table className="adm" style={{ marginTop: 6 }}>
              <tbody>
                {(logs ?? []).map((l) => (
                  <tr key={l.id}>
                    <td>{(l.workouts as unknown as { title: string } | null)?.title}{l.notes && <div className="sub" style={{ fontSize: 12 }}>“{l.notes}”</div>}</td>
                    <td>{l.rpe ? `RPE ${l.rpe}` : ''}</td>
                    <td className="sub">{fmtDateTime(l.completed_at)}</td>
                  </tr>
                ))}
                {(logs ?? []).length === 0 && <tr><td className="empty">Sin sesiones aún</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="card">
            <b>PRs</b>
            
            <table className="adm" style={{ marginTop: 6 }}>
              <tbody>
                {(prs ?? []).map((p, i) => <tr key={i}><td>{p.exercise}</td><td>{Number(p.weight_kg)} kg × {p.reps}</td><td className="sub">{p.performed_on}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

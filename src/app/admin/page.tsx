import { getSessionProfile } from '@/lib/supabase/server';
import { fmtDateTime, getActiveChallenge, mxn, shortName } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { awardPoints, deletePoints, enrollByEmail, setAppointmentStatus, setOrderStatus } from './actions';

type Joined = { full_name: string | null; email?: string | null } | null;
const who = (p: unknown) => shortName((p as Joined)?.full_name ?? null);

export default async function AdminHome() {
  const { supabase } = await getSessionProfile();
  const challenge = await getActiveChallenge(supabase);
  const [{ data: orders }, { data: appts }, { data: points }, { data: staffActions }, { count: members }, { count: subs }, { count: unread }] = await Promise.all([
    supabase.from('orders').select('id, total_mxn, items, created_at, profiles(full_name)').eq('status', 'pagada').order('created_at').limit(30),
    supabase.from('appointments').select('id, preferred_at, notes, profiles(full_name, email), wellness_services(name)').eq('status', 'pendiente').order('preferred_at').limit(30),
    supabase.from('points_log').select('id, points, profiles!points_log_user_id_fkey(full_name), challenge_actions(label)').order('created_at', { ascending: false }).limit(20),
    challenge
      ? supabase.from('challenge_actions').select('id, label, points').eq('challenge_id', challenge.id).eq('self_report', false)
      : Promise.resolve({ data: [] as { id: string; label: string; points: number }[] }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).in('status', ['active', 'trialing']),
    supabase.from('coach_messages').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 864e5).toISOString()),
  ]);

  return (
    <main>
      <h1>Resumen</h1>
      <div className="stats" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat"><b>{members ?? 0}</b><small>cuentas creadas</small></div>
        <div className="stat"><b>{subs ?? 0}</b><small>suscripciones activas</small></div>
        <div className="stat"><b>{(orders ?? []).length}</b><small>pedidos por entregar</small></div>
        <div className="stat"><b>{unread ?? 0}</b><small>mensajes en 24 h</small></div>
      </div>

      <div className="cols" style={{ marginTop: 6 }}>
        <div>
          <div className="sec"><h3>Pedidos por entregar</h3></div>
          <div className="card list" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {(orders ?? []).length === 0 && <div className="empty">Nada pendiente 👌</div>}
            {(orders ?? []).map((o) => (
              <div key={o.id} className="between">
                <div>
                  <b style={{ fontSize: 14 }}>{who(o.profiles)}</b> · {mxn(o.total_mxn)}<br />
                  <small className="sub" style={{ fontSize: 12 }}>{(o.items as { name: string; qty: number }[]).map((i) => `${i.qty}× ${i.name}`).join(', ')}</small>
                </div>
                <form action={setOrderStatus}>
                  <input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="entregada" />
                  <button className="btn ghost sm">Entregado</button>
                </form>
              </div>
            ))}
          </div>

          <div className="sec"><h3>Citas por confirmar</h3></div>
          <div className="card list" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {(appts ?? []).length === 0 && <div className="empty">Sin solicitudes</div>}
            {(appts ?? []).map((a) => (
              <div key={a.id}>
                <b style={{ fontSize: 14 }}>{(a.wellness_services as unknown as { name: string })?.name}</b> · {who(a.profiles)}
                <div className="sub" style={{ fontSize: 12 }}>
                  {fmtDateTime(a.preferred_at)} · {(a.profiles as unknown as Joined)?.email}{a.notes && <> · “{a.notes}”</>}
                </div>
                <div className="row" style={{ marginTop: 8, gap: 8 }}>
                  {['confirmada', 'cancelada'].map((s) => (
                    <form key={s} action={setAppointmentStatus}>
                      <input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={s} />
                      <button className={`btn sm ${s === 'confirmada' ? 'pri' : 'ghost'}`}>{s === 'confirmada' ? 'Confirmar' : 'Cancelar'}</button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {challenge && (
          <div>
            <div className="sec"><h3>{challenge.name}</h3></div>
            <ActionForm action={enrollByEmail} className="card">
              <b style={{ fontSize: 14 }}>Inscribir a quien pagó en recepción</b>
              <input type="hidden" name="challenge_id" value={challenge.id} />
              <div className="inline" style={{ marginTop: 10 }}>
                <div className="field" style={{ margin: 0 }}><input name="email" type="email" required placeholder="correo@cliente.com" /></div>
                <Submit className="btn pri sm">Inscribir</Submit>
              </div>
            </ActionForm>
            {(staffActions ?? []).length > 0 && (
              <ActionForm action={awardPoints} className="card">
                <b style={{ fontSize: 14 }}>Dar puntos (referido que compró)</b>
                <div className="field" style={{ marginTop: 10 }}>
                  <select name="action_id">{(staffActions ?? []).map((a) => <option key={a.id} value={a.id}>{a.label} (+{a.points})</option>)}</select>
                </div>
                <div className="inline">
                  <div className="field" style={{ margin: 0 }}><input name="email" type="email" required placeholder="correo de quien recibe" /></div>
                  <Submit className="btn pri sm">Dar</Submit>
                </div>
              </ActionForm>
            )}
            <div className="card">
              <b style={{ fontSize: 14 }}>Últimos puntos</b>
              <table className="adm" style={{ marginTop: 8 }}>
                <tbody>
                  {(points ?? []).map((p) => (
                    <tr key={p.id}>
                      <td>{who(p.profiles)}</td>
                      <td>{(p.challenge_actions as unknown as { label: string })?.label}</td>
                      <td>+{p.points}</td>
                      <td><form action={deletePoints}><input type="hidden" name="id" value={p.id} /><button className="btn ghost sm" title="Quitar">✕</button></form></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

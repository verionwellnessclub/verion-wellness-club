import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { fmtDateTime } from '@/lib/data';

export default async function Clientes() {
  const { supabase } = await getSessionProfile();
  const [{ data: subs }, { data: lastMsgs }] = await Promise.all([
    supabase.from('subscriptions')
      .select('user_id, status, current_period_end, cancel_at_period_end, plans(name, includes_coaching), profiles(full_name, email)')
      .in('status', ['active', 'trialing', 'past_due']).order('updated_at', { ascending: false }),
    supabase.from('coach_messages').select('client_id, author_id, created_at').order('created_at', { ascending: false }).limit(300),
  ]);
  // Último mensaje por cliente: si lo escribió el cliente, está pendiente de respuesta
  const last = new Map<string, { mine: boolean; at: string }>();
  (lastMsgs ?? []).forEach((m) => { if (!last.has(m.client_id)) last.set(m.client_id, { mine: m.author_id === m.client_id, at: m.created_at }); });

  return (
    <main>
      <h1>Clientes online</h1>
      <p className="sub">Suscriptores activos. Los de Coaching Personalizado necesitan plan y seguimiento.</p>
      <div className="card">
        <table className="adm">
          <thead><tr><th>Cliente</th><th>Plan</th><th>Renueva</th><th>Chat</th><th /></tr></thead>
          <tbody>
            {(subs ?? []).map((s) => {
              const pr = s.profiles as unknown as { full_name: string; email: string } | null;
              const pl = s.plans as unknown as { name: string; includes_coaching: boolean } | null;
              const l = last.get(s.user_id);
              return (
                <tr key={s.user_id}>
                  <td><b>{pr?.full_name}</b><div className="sub" style={{ fontSize: 12 }}>{pr?.email}</div></td>
                  <td>{pl?.name}{s.status === 'past_due' && <span className="tag warn" style={{ marginLeft: 6 }}>Pago pendiente</span>}</td>
                  <td>{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('es-MX') : '—'}{s.cancel_at_period_end && <div className="sub" style={{ fontSize: 12 }}>cancelará</div>}</td>
                  <td>{pl?.includes_coaching ? (l?.mine ? <span className="tag warn">Por responder</span> : l ? <span className="sub" style={{ fontSize: 12 }}>{fmtDateTime(l.at)}</span> : <span className="tag warn">Sin contacto</span>) : '—'}</td>
                  <td><Link href={`/admin/clientes/${s.user_id}`} className="btn ghost sm">Abrir</Link></td>
                </tr>
              );
            })}
            {(subs ?? []).length === 0 && <tr><td colSpan={5} className="empty">Aún no hay suscriptores</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}

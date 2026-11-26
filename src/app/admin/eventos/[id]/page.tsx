import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionProfile } from '@/lib/supabase/server';
import { fmtDateTime } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { checkInTicket, markAttended } from '../../actions';

export default async function EventoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSessionProfile();
  const [{ data: e }, { data: tickets }] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).maybeSingle(),
    supabase.from('event_tickets').select('id, code, status, paid, profiles(full_name, email)').eq('event_id', id).neq('status', 'cancelado').order('created_at'),
  ]);
  if (!e) notFound();
  const came = (tickets ?? []).filter((t) => t.status === 'asistio').length;

  return (
    <main>
      <Link href="/admin/eventos" className="sub">← Eventos</Link>
      <h1 style={{ marginTop: 8 }}>{e.emoji} {e.title}</h1>
      <p className="sub">{fmtDateTime(e.starts_at)} · {e.location} · <Link href={`/eventos/${e.slug}`} style={{ color: 'var(--accent)' }}>ver página pública ↗</Link></p>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat"><b>{(tickets ?? []).length}</b><small>boletos</small></div>
        <div className="stat"><b>{came}</b><small>llegaron</small></div>
        <div className="stat"><b>{e.capacity ?? '∞'}</b><small>cupo</small></div>
      </div>

      <ActionForm action={checkInTicket} className="card">
        <b>Check-in en la puerta</b>
        <p className="sub" style={{ fontSize: 13, margin: '4px 0 10px' }}>Escribe el código que aparece debajo del QR del asistente (o escanéalo con la cámara del celular y copia el texto).</p>
        <input type="hidden" name="event_id" value={id} />
        <div className="inline">
          <div className="field" style={{ margin: 0 }}><input name="code" required placeholder="A1B2C3D4" style={{ textTransform: 'uppercase', letterSpacing: '.1em' }} autoComplete="off" /></div>
          <Submit className="btn pri sm">Validar</Submit>
        </div>
      </ActionForm>

      <div className="card">
        <table className="adm">
          <thead><tr><th>Asistente</th><th>Código</th><th>Pago</th><th>Estado</th></tr></thead>
          <tbody>
            {(tickets ?? []).map((t) => {
              const pr = t.profiles as unknown as { full_name: string; email: string } | null;
              return (
                <tr key={t.id}>
                  <td><b>{pr?.full_name}</b><div className="sub" style={{ fontSize: 12 }}>{pr?.email}</div></td>
                  <td style={{ fontFamily: 'monospace' }}>{t.code}</td>
                  <td>{e.price_mxn ? (t.paid ? 'Pagado' : '—') : 'Gratis'}</td>
                  <td>
                    {t.status === 'asistio' ? <span className="tag ok">Llegó</span> : (
                      <form action={markAttended}>
                        <input type="hidden" name="id" value={t.id} /><input type="hidden" name="event_id" value={id} />
                        <button className="btn ghost sm">Marcar llegada</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {(tickets ?? []).length === 0 && <tr><td colSpan={4} className="empty">Sin boletos aún</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}

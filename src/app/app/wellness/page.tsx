import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { mxn } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { requestAppointment } from '../actions';

const CATS = [
  ['', 'Todo'],
  ['nut', 'Nutrición'],
  ['fis', 'Fisio'],
  ['rec', 'Recuperación'],
  ['pt', '1:1'],
] as const;

const STATUS: Record<string, string> = { pendiente: 'warn', confirmada: 'ok', completada: 'dark', cancelada: 'dark' };

export default async function Wellness({ searchParams }: { searchParams: Promise<{ c?: string; s?: string }> }) {
  const { c, s } = await searchParams;
  const { supabase, user } = await getSessionProfile();

  let q = supabase.from('wellness_services').select('*').eq('active', true).order('category');
  if (c) q = q.eq('category', c);
  const [{ data: services }, { data: mine }] = await Promise.all([
    q,
    supabase
      .from('appointments')
      .select('id, preferred_at, status, wellness_services(name)')
      .eq('user_id', user!.id)
      .order('preferred_at', { ascending: false })
      .limit(5),
  ]);

  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

  return (
    <main className="page">
      <div className="hello">Wellness y 1:1</div>
      <div className="sub">Sesiones personales en Verion, nutrición, fisio y recuperación con precio de socio.</div>
      <div className="chips">
        {CATS.map(([k, label]) => (
          <Link key={k} href={k ? `/app/wellness?c=${k}` : '/app/wellness'} className={`chip ${(c ?? '') === k ? 'on' : ''}`}>{label}</Link>
        ))}
      </div>

      {(services ?? []).map((sv) => (
        <div className="card" key={sv.id}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 24, background: 'rgba(255,90,31,.1)', flex: 'none' }}>{sv.emoji}</div>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 15 }}>{sv.name}</b>
              <div className="sub" style={{ fontSize: 12, marginTop: 2 }}>{sv.description} · {sv.provider_name}</div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>{mxn(sv.price_member)} <span className="strike">{mxn(sv.price_regular)}</span></div>
            </div>
            {s !== sv.id && <Link href={`/app/wellness?${c ? `c=${c}&` : ''}s=${sv.id}`} className="btn pri sm">Agendar</Link>}
          </div>

          {s === sv.id && (
            <ActionForm action={requestAppointment} resetOnSuccess={false}>
              <input type="hidden" name="service_id" value={sv.id} />
              <div className="grid2" style={{ marginTop: 12 }}>
                <div className="field"><label>Día</label><input type="date" name="date" min={tomorrow} required /></div>
                <div className="field">
                  <label>Hora</label>
                  <select name="time">{['08:00', '09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00', '19:00'].map((h) => <option key={h}>{h}</option>)}</select>
                </div>
              </div>
              <div className="field"><label>¿Algo que debamos saber? (opcional)</label><input name="notes" maxLength={300} placeholder="Ej. molestia en rodilla derecha" /></div>
              <Submit>Solicitar cita</Submit>
              <p className="sub" style={{ fontSize: 12, marginTop: 8 }}>Te confirmamos disponibilidad. Pagas en tu cita con precio de socio.</p>
            </ActionForm>
          )}
        </div>
      ))}

      {(mine ?? []).length > 0 && (
        <>
          <div className="sec"><h3>Mis citas</h3></div>
          <div className="card list" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {(mine ?? []).map((a) => {
              const svc = a.wellness_services as unknown as { name: string } | null;
              return (
                <div key={a.id} className="between">
                  <div>
                    <b style={{ fontSize: 14 }}>{svc?.name}</b><br />
                    <small className="sub" style={{ fontSize: 12 }}>
                      {new Date(a.preferred_at).toLocaleString('es-MX', { timeZone: 'America/Monterrey', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </small>
                  </div>
                  <span className={`tag ${STATUS[a.status]}`}>{a.status}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="card" style={{ background: 'var(--panel2)' }}>
        <h3 style={{ fontSize: 17 }}>¿Eres profesional de la salud en Saltillo?</h3>
        <p className="sub" style={{ marginTop: 6 }}>Únete a la red Verion. Escríbenos por Instagram o pregunta en recepción.</p>
      </div>
    </main>
  );
}

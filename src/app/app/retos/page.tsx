import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { challengeDay, getActiveChallenge, getLeaderboard, mxn, shortName } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { CheckoutButton } from '@/components/CheckoutButton';
import { logActivity } from '../actions';

export default async function Retos({ searchParams }: { searchParams: Promise<{ t?: string; pagado?: string }> }) {
  const { t, pagado } = await searchParams;
  const { supabase, user } = await getSessionProfile();
  const challenge = await getActiveChallenge(supabase);

  if (!challenge) {
    return (
      <main className="page">
        <div className="hello">Retos</div>
        <div className="card empty">No hay retos activos por ahora. ¡Pronto viene el siguiente! 🔥</div>
      </main>
    );
  }

  const [{ data: entry }, { data: actions }, { data: product }, board] = await Promise.all([
    supabase.from('challenge_entries').select('paid').eq('challenge_id', challenge.id).eq('user_id', user!.id).maybeSingle(),
    supabase.from('challenge_actions').select('*').eq('challenge_id', challenge.id).order('points'),
    supabase.from('products').select('id, price_mxn').eq('challenge_id', challenge.id).eq('active', true).maybeSingle(),
    getLeaderboard(supabase, challenge.id),
  ]);

  const { day, total, started, finished } = challengeDay(challenge);
  const me = board.find((r) => r.user_id === user!.id);
  const filtered = board.filter((r) => !t || r.schedule === t);
  const myPos = filtered.findIndex((r) => r.user_id === user!.id);
  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  return (
    <main className="page">
      <div className="hello">Retos</div>
      <div className="sub">Compite, suma puntos y gana premios.</div>

      <div className="card hero">
        <span className="tag">{finished ? 'Terminado' : started ? 'En curso' : 'Próximamente'} · {fmt(challenge.starts_on)} – {fmt(challenge.ends_on)}</span>
        <div className="big" style={{ margin: '12px 0 6px', fontSize: 36 }}>{challenge.name} 🔥</div>
        {started && (
          <>
            <div style={{ opacity: 0.9, fontSize: 14 }}>Día <b>{day}</b> de {total}</div>
            <div style={{ height: 6, background: 'rgba(255,255,255,.25)', borderRadius: 9, marginTop: 10 }}>
              <div style={{ width: `${(day / total) * 100}%`, height: '100%', background: '#fff', borderRadius: 9 }} />
            </div>
          </>
        )}
        {entry ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Tus puntos</div>
            <div className="big">{me?.points ?? 0}</div>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            {pagado ? (
              <div className="tag">Pago recibido · activando tu inscripción…</div>
            ) : product ? (
              <CheckoutButton items={[{ id: product.id, qty: 1 }]} label={`Inscribirme · ${mxn(product.price_mxn)}`} className="btn white" />
            ) : (
              <div style={{ fontSize: 14 }}>Inscríbete en recepción.</div>
            )}
          </div>
        )}
      </div>

      {entry && started && !finished && (
        <>
          <div className="sec"><h3>Registrar actividad</h3></div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(actions ?? []).filter((a) => a.self_report && a.code !== 'pr' && a.code !== 'online').map((a) => (
              <ActionForm key={a.id} action={logActivity}>
                <input type="hidden" name="action_id" value={a.id} />
                <Submit className="btn ghost" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{a.label}</span>
                  <b style={{ color: 'var(--accent2)' }}>+{a.points}</b>
                </Submit>
              </ActionForm>
            ))}
            <p className="sub" style={{ fontSize: 12 }}>
              Los entrenamientos online suman al completarlos en Entrenar y los PRs desde <Link href="/app/progreso" style={{ color: 'var(--accent)' }}>Progreso</Link>. Los referidos los
              registra un coach cuando tu invitado compra.
            </p>
          </div>
        </>
      )}

      <div className="sec"><h3>Premios</h3></div>
      <div className="card">
        {challenge.prizes.map((p) => (
          <div className="rule" key={p.place}><span>{p.place}</span><b>{p.prize}</b></div>
        ))}
      </div>

      <div className="sec">
        <h3>Ranking</h3>
        <div className="chips" style={{ margin: 0 }}>
          <Link href="/app/retos" className={`chip ${!t ? 'on' : ''}`}>General</Link>
          <Link href="/app/retos?t=m" className={`chip ${t === 'm' ? 'on' : ''}`}>Mañana</Link>
          <Link href="/app/retos?t=t" className={`chip ${t === 't' ? 'on' : ''}`}>Tarde</Link>
        </div>
      </div>
      <div className="card list" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {filtered.length === 0 && <div className="empty">Aún no hay inscritos aquí.</div>}
        {filtered.slice(0, 20).map((r, i) => (
          <div key={r.user_id} className={`lb ${r.user_id === user!.id ? 'me' : ''}`}>
            <span className="pos">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
            <span>{r.user_id === user!.id ? 'Tú' : shortName(r.full_name)}</span>
            <span className="pts">{r.points}</span>
          </div>
        ))}
        {myPos >= 20 && (
          <div className="lb me"><span className="pos">{myPos + 1}</span><span>Tú</span><span className="pts">{me?.points}</span></div>
        )}
      </div>

      <div className="sec"><h3>Cómo sumar puntos</h3></div>
      <div className="card">
        {(actions ?? []).map((a) => (
          <div className="rule" key={a.id}><span>{a.label}</span><b>+{a.points}</b></div>
        ))}
      </div>
      <p className="sub" style={{ marginTop: 10, fontSize: 12 }}>
        Los puntos premian la constancia, no el peso levantado: el reto es parejo para todas y todos.
      </p>
    </main>
  );
}

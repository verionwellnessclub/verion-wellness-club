import Link from 'next/link';
import { mxn } from '@/lib/data';
import { SubscribeButton } from './SubscribeButton';

export type Plan = {
  id: string; slug: string; name: string; description: string | null;
  price_mxn: number; features: string[]; includes_coaching: boolean;
};

/** Tarjetas de planes. Con `loggedIn` muestra el botón de pago; si no, manda a crear cuenta. */
export function PlanCards({ plans, loggedIn = false, currentPlan }: { plans: Plan[]; loggedIn?: boolean; currentPlan?: string | null }) {
  return (
    <div className="sgrid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {plans.map((p) => (
        <div key={p.id} className={`scard plan ${p.includes_coaching ? 'feat' : ''}`}>
          {p.includes_coaching && <span className="tag" style={{ background: 'var(--accent)', alignSelf: 'flex-start' }}>Más completo</span>}
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          <div className="price">{mxn(p.price_mxn)} <small>/ mes</small></div>
          <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
          <div style={{ marginTop: 'auto' }}>
            {currentPlan === p.name ? (
              <span className="tag ok">Tu plan actual</span>
            ) : loggedIn ? (
              <SubscribeButton planId={p.id} label={`Suscribirme · ${mxn(p.price_mxn)}/mes`} />
            ) : (
              <Link href={`/login?next=/app/club`} className="btn pri">Empezar</Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

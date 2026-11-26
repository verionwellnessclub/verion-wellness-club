import { getSessionProfile } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/access';
import { PlanCards, type Plan } from '@/components/PlanCards';
import { ManageSubscriptionButton } from '@/components/SubscribeButton';

export default async function ClubPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const { supabase, user } = await getSessionProfile();
  const [sub, { data: plans }] = await Promise.all([
    getSubscription(supabase, user!.id),
    supabase.from('plans').select('*').eq('active', true).order('sort'),
  ]);

  return (
    <main className="page">
      <div className="hello">Club Online</div>
      <div className="sub">Programas con video, plan personalizado y coach por chat.</div>
      {ok && !sub.active && <div className="msg ok">✅ Pago recibido. Tu acceso se activa en unos segundos; recarga la página.</div>}
      {sub.active && (
        <div className="card">
          <span className="tag ok">Activo</span>
          <h3 style={{ marginTop: 10 }}>{sub.planName}</h3>
          <p className="sub" style={{ margin: '6px 0 12px' }}>
            {sub.cancelAtEnd ? 'Se cancela' : 'Se renueva'} el {sub.periodEnd ? new Date(sub.periodEnd).toLocaleDateString('es-MX') : '—'}.
          </p>
          <ManageSubscriptionButton />
        </div>
      )}
      <div style={{ marginTop: 6 }}>
        <PlanCards plans={(plans ?? []) as Plan[]} loggedIn currentPlan={sub.planName} />
      </div>
      {sub.active && <p className="sub" style={{ fontSize: 12, marginTop: 12 }}>Para cambiar de plan, cancela el actual desde “Administrar suscripción” y suscríbete al nuevo.</p>}
    </main>
  );
}

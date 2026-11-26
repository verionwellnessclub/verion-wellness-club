import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/access';
import { ActionForm, Submit } from '@/components/ActionForm';
import { ManageSubscriptionButton } from '@/components/SubscribeButton';
import { signOut, updateProfile } from '../actions';

export default async function Perfil() {
  const { supabase, user, profile } = await getSessionProfile();
  const sub = await getSubscription(supabase, user!.id);
  return (
    <main className="page">
      <div className="hello">Mi perfil</div>
      <div className="sub">{profile?.email}</div>

      <div className="card">
        <div className="between">
          <b>Club Online</b>
          {sub.active ? <span className="tag ok">{sub.planName}</span> : <span className="tag dark">Sin suscripción</span>}
        </div>
        <div style={{ marginTop: 12 }}>
          {sub.customerId ? <ManageSubscriptionButton /> : <Link href="/app/club" className="btn pri">Ver planes</Link>}
        </div>
      </div>

      <ActionForm action={updateProfile} className="card" resetOnSuccess={false}>
        <div className="field"><label>Nombre</label><input name="full_name" defaultValue={profile?.full_name ?? ''} /></div>
        <div className="field">
          <label>¿En qué horario entrenas en el estudio? (para el ranking)</label>
          <select name="schedule" defaultValue={profile?.schedule}>
            <option value="m">Mañana</option>
            <option value="t">Tarde</option>
          </select>
        </div>
        <Submit>Guardar</Submit>
      </ActionForm>

      <div className="card">
        <div className="sub">Tu código de embajador</div>
        <div className="code">{profile?.referral_code}</div>
      </div>

      <form action={signOut} style={{ marginTop: 14 }}>
        <button className="btn ghost">Cerrar sesión</button>
      </form>
    </main>
  );
}

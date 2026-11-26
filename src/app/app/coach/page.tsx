import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/access';
import { fmtDateTime } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { sendCoachMessage } from '../actions';

export default async function Coach() {
  const { supabase, user } = await getSessionProfile();
  const sub = await getSubscription(supabase, user!.id);
  if (!sub.coaching) {
    return (
      <main className="page">
        <div className="hello">Mi coach</div>
        <div className="card hero">
          <div className="big" style={{ fontSize: 24 }}>Ten un coach de Verion contigo</div>
          <p style={{ opacity: 0.9, fontSize: 14, marginTop: 8 }}>Plan hecho a tu medida, ajustes según tu progreso y chat directo.</p>
          <Link href="/app/club" className="btn white sm" style={{ marginTop: 14 }}>Ver Coaching Personalizado</Link>
        </div>
      </main>
    );
  }
  const { data: msgs } = await supabase.from('coach_messages').select('id, author_id, body, created_at')
    .eq('client_id', user!.id).order('created_at').limit(200);

  return (
    <main className="page">
      <div className="hello">Mi coach</div>
      <div className="sub">Cuéntale tus objetivos, cómo te sientes y tus dudas.</div>
      <div className="card">
        <div className="thread">
          {(msgs ?? []).length === 0 && <div className="empty">Escribe tu primer mensaje: objetivos, lesiones, días y horarios disponibles, y equipo con el que cuentas.</div>}
          {(msgs ?? []).map((m) => (
            <div key={m.id} className={`bubble ${m.author_id === user!.id ? 'mine' : ''}`}>
              {m.body}<small>{m.author_id === user!.id ? 'Tú' : 'Coach'} · {fmtDateTime(m.created_at)}</small>
            </div>
          ))}
        </div>
      </div>
      <ActionForm action={sendCoachMessage} className="card">
        <textarea name="body" rows={3} maxLength={2000} placeholder="Escribe a tu coach…" required />
        <div style={{ marginTop: 8, textAlign: 'right' }}><Submit className="btn pri sm">Enviar</Submit></div>
      </ActionForm>
    </main>
  );
}

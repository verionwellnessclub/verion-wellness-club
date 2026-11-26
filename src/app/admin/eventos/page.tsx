import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { EVENT_KINDS } from '@/config/site';
import { fmtDateTime, mxn } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { createEvent, togglePublished } from '../actions';

export default async function EventosAdmin() {
  const { supabase } = await getSessionProfile();
  const { data: events } = await supabase.from('events').select('*, event_tickets(count)').order('starts_at', { ascending: false }).limit(50);

  return (
    <main>
      <h1>Eventos</h1>
      <p className="sub">Runs con café, eventos con marcas, workshops. Los publicados aparecen en la web y la app.</p>
      <div className="cols">
        <ActionForm action={createEvent} className="card">
          <b>Nuevo evento</b>
          <div className="inline" style={{ marginTop: 10 }}>
            <div className="field" style={{ maxWidth: 80 }}><label>Emoji</label><input name="emoji" defaultValue="☕" /></div>
            <div className="field"><label>Título *</label><input name="title" required placeholder="Run & Coffee" /></div>
          </div>
          <div className="inline">
            <div className="field"><label>Tipo</label><select name="kind">{Object.entries(EVENT_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="field"><label>Marca aliada</label><input name="partner_name" placeholder="Opcional" /></div>
          </div>
          <div className="inline">
            <div className="field"><label>Fecha *</label><input name="date" type="date" required /></div>
            <div className="field"><label>Hora *</label><input name="time" type="time" required defaultValue="07:30" /></div>
          </div>
          <div className="field"><label>Lugar</label><input name="location" placeholder="Saliendo de Verion" /></div>
          <div className="inline">
            <div className="field"><label>Precio (0 = gratis)</label><input name="price_mxn" type="number" min={0} defaultValue={0} /></div>
            <div className="field"><label>Cupo (vacío = sin límite)</label><input name="capacity" type="number" min={1} /></div>
          </div>
          <div className="field"><label>Descripción</label><textarea name="description" rows={4} placeholder="Ruta, ritmo, qué incluye, qué llevar…" /></div>
          <label className="row" style={{ fontSize: 14, marginBottom: 10 }}><input type="checkbox" name="published" defaultChecked style={{ width: 'auto' }} /> Publicar ya</label>
          <Submit>Crear evento</Submit>
        </ActionForm>

        <div className="card">
          <table className="adm">
            <thead><tr><th>Evento</th><th>Boletos</th><th>Estado</th></tr></thead>
            <tbody>
              {(events ?? []).map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/admin/eventos/${e.id}`}><b>{e.emoji} {e.title}</b></Link>
                    <div className="sub" style={{ fontSize: 12 }}>{fmtDateTime(e.starts_at)} · {e.price_mxn ? mxn(e.price_mxn) : 'Gratis'}</div>
                  </td>
                  <td>{(e.event_tickets as { count: number }[])?.[0]?.count ?? 0}{e.capacity ? ` / ${e.capacity}` : ''}</td>
                  <td>
                    <form action={togglePublished}>
                      <input type="hidden" name="table" value="events" /><input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="value" value={String(!e.published)} />
                      <button className={`tag ${e.published ? 'ok' : 'dark'}`} style={{ border: 0, cursor: 'pointer' }}>{e.published ? 'Publicado' : 'Oculto'}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

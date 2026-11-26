import Link from 'next/link';
import { getSessionProfile } from '@/lib/supabase/server';
import { NEWS_KINDS } from '@/config/site';
import { fmtDate } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { createNews, togglePublished } from '../actions';

export default async function NoticiasAdmin() {
  const { supabase } = await getSessionProfile();
  const { data: news } = await supabase.from('news').select('id, slug, title, kind, emoji, published, published_at').order('published_at', { ascending: false });

  return (
    <main>
      <h1>Noticias y alianzas</h1>
      <p className="sub">Afiliaciones, marcas aliadas y novedades. Se publican en verionwellnessclub.com/noticias.</p>
      <div className="cols">
        <ActionForm action={createNews} className="card">
          <b>Nueva publicación</b>
          <div className="inline" style={{ marginTop: 10 }}>
            <div className="field" style={{ maxWidth: 80 }}><label>Emoji</label><input name="emoji" defaultValue="🤝" /></div>
            <div className="field"><label>Título *</label><input name="title" required placeholder="Nueva alianza con…" /></div>
          </div>
          <div className="inline">
            <div className="field"><label>Tipo</label><select name="kind">{Object.entries(NEWS_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="field"><label>Marca / aliado</label><input name="partner_name" /></div>
          </div>
          <div className="field"><label>Link del aliado</label><input name="partner_url" type="url" placeholder="https://" /></div>
          <div className="field"><label>Resumen (1–2 líneas)</label><input name="summary" maxLength={200} /></div>
          <div className="field"><label>Texto completo</label><textarea name="body" rows={6} placeholder="Qué es, qué beneficio tienen los miembros, cómo aprovecharlo…" /></div>
          <label className="row" style={{ fontSize: 14, marginBottom: 10 }}><input type="checkbox" name="published" defaultChecked style={{ width: 'auto' }} /> Publicar ya</label>
          <Submit>Publicar</Submit>
        </ActionForm>

        <div className="card">
          <table className="adm">
            <tbody>
              {(news ?? []).map((n) => (
                <tr key={n.id}>
                  <td><Link href={`/noticias/${n.slug}`}><b>{n.emoji} {n.title}</b></Link><div className="sub" style={{ fontSize: 12 }}>{NEWS_KINDS[n.kind]} · {fmtDate(n.published_at)}</div></td>
                  <td>
                    <form action={togglePublished}>
                      <input type="hidden" name="table" value="news" /><input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="value" value={String(!n.published)} />
                      <button className={`tag ${n.published ? 'ok' : 'dark'}`} style={{ border: 0, cursor: 'pointer' }}>{n.published ? 'Publicada' : 'Oculta'}</button>
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

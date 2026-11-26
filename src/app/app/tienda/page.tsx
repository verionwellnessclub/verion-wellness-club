import { getSessionProfile } from '@/lib/supabase/server';
import { Shop, type Product } from './Shop';

export default async function Tienda({ searchParams }: { searchParams: Promise<{ pagado?: string; cancelado?: string }> }) {
  const { pagado, cancelado } = await searchParams;
  const { supabase, user } = await getSessionProfile();
  const [{ data: products }, { data: orders }] = await Promise.all([
    supabase.from('products').select('*').eq('active', true).neq('kind', 'challenge').order('sort'),
    supabase.from('orders').select('id, status, total_mxn, items, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
  ]);

  return (
    <main className="page">
      <div className="hello">Tienda</div>
      <div className="sub">Paga aquí y recoge en recepción después de clase.</div>
      {pagado && <div className="msg ok">✅ ¡Pago recibido! Tu pedido estará listo en recepción.</div>}
      {cancelado && <div className="msg err">El pago se canceló. Tu carrito sigue aquí.</div>}

      <Shop products={(products ?? []) as Product[]} />

      {(orders ?? []).length > 0 && (
        <>
          <div className="sec"><h3>Mis pedidos</h3></div>
          <div className="card list" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {(orders ?? []).map((o) => (
              <div key={o.id} className="between">
                <div>
                  <b style={{ fontSize: 14 }}>{(o.items as { name: string; qty: number }[]).map((i) => `${i.qty}× ${i.name}`).join(', ')}</b><br />
                  <small className="sub" style={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('es-MX')} · ${o.total_mxn}</small>
                </div>
                <span className={`tag ${o.status === 'pagada' ? 'ok' : o.status === 'entregada' ? 'dark' : 'warn'}`}>{o.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { CheckoutButton } from '@/components/CheckoutButton';

export type Product = {
  id: string; name: string; description: string | null; emoji: string | null;
  price_mxn: number; compare_mxn: number | null; kind: 'product' | 'bundle';
};

const mxn = (n: number) => '$' + n.toLocaleString('es-MX');

export function Shop({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('verion_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('verion_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('pagado')) setCart({});
  }, []);

  const add = (id: string, d = 1) =>
    setCart((c) => {
      const n = Math.max(0, (c[id] ?? 0) + d);
      const next = { ...c, [id]: n };
      if (!n) delete next[id];
      return next;
    });

  const lines = products.filter((p) => cart[p.id]);
  const total = lines.reduce((s, p) => s + p.price_mxn * cart[p.id], 0);
  const bundles = products.filter((p) => p.kind === 'bundle');
  const items = products.filter((p) => p.kind === 'product');

  return (
    <>
      {bundles.map((b) => (
        <div key={b.id} className="card" style={{ background: 'linear-gradient(145deg,#1f1f25,#2b2b33)' }}>
          <span className="tag" style={{ background: 'rgba(255,90,31,.2)', color: 'var(--accent)' }}>Bundle</span>
          <h3 style={{ fontSize: 22, margin: '10px 0 4px' }}>{b.emoji} {b.name}</h3>
          <div className="sub">{b.description}</div>
          <div className="between" style={{ marginTop: 14 }}>
            <div className="big" style={{ fontSize: 26 }}>{mxn(b.price_mxn)}{b.compare_mxn && <span className="strike">{mxn(b.compare_mxn)}</span>}</div>
            <button className="btn pri sm" onClick={() => add(b.id)}>Agregar</button>
          </div>
        </div>
      ))}

      <div className="grid2">
        {items.map((p) => (
          <div key={p.id} className="prod">
            <div className="img">{p.emoji}</div>
            <b style={{ fontSize: 14 }}>{p.name}</b>
            {p.description && <small className="sub" style={{ fontSize: 12 }}>{p.description}</small>}
            <div className="price">{mxn(p.price_mxn)}{p.compare_mxn && <span className="strike">{mxn(p.compare_mxn)}</span>}</div>
            {cart[p.id] ? (
              <div className="between" style={{ marginTop: 'auto' }}>
                <button className="btn ghost sm" onClick={() => add(p.id, -1)}>−</button>
                <b>{cart[p.id]}</b>
                <button className="btn ghost sm" onClick={() => add(p.id)}>+</button>
              </div>
            ) : (
              <button className="btn ghost sm" style={{ width: '100%', marginTop: 'auto' }} onClick={() => add(p.id)}>Agregar</button>
            )}
          </div>
        ))}
      </div>

      {lines.length > 0 && (
        <div className="card" style={{ position: 'sticky', bottom: 90, boxShadow: '0 -10px 30px rgba(0,0,0,.5)' }}>
          {lines.map((p) => (
            <div className="rule" key={p.id}><span>{cart[p.id]}× {p.name}</span><span>{mxn(p.price_mxn * cart[p.id])}</span></div>
          ))}
          <div className="rule" style={{ fontWeight: 700 }}><span>Total</span><span>{mxn(total)}</span></div>
          <div style={{ marginTop: 10 }}>
            <CheckoutButton items={lines.map((p) => ({ id: p.id, qty: cart[p.id] }))} label={`Pagar ${mxn(total)}`} />
          </div>
        </div>
      )}
    </>
  );
}

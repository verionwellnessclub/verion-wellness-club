'use client';
import { useState } from 'react';

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo continuar');
  return data.url as string;
}

export function SubscribeButton({ planId, label }: { planId: string; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <button
        className="btn pri"
        disabled={loading}
        onClick={async () => {
          setLoading(true); setError('');
          try { window.location.href = await post('/api/subscribe', { planId }); }
          catch (e) { setError((e as Error).message); setLoading(false); }
        }}
      >
        {loading ? 'Abriendo pago…' : label}
      </button>
      {error && <div className="msg err">{error}</div>}
    </>
  );
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <button
        className="btn ghost"
        disabled={loading}
        onClick={async () => {
          setLoading(true); setError('');
          try { window.location.href = await post('/api/portal', {}); }
          catch (e) { setError((e as Error).message); setLoading(false); }
        }}
      >
        {loading ? 'Abriendo…' : 'Administrar suscripción (tarjeta, cancelar)'}
      </button>
      {error && <div className="msg err">{error}</div>}
    </>
  );
}

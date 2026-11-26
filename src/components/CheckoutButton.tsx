'use client';
import { useState } from 'react';

/** Manda los productos al servidor, que crea la sesión de Stripe Checkout y redirige. */
export function CheckoutButton({
  items = [],
  eventId,
  label,
  className = 'btn pri',
  disabled,
}: {
  items?: { id: string; qty: number }[];
  eventId?: string;
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function go() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventId ? { event_id: eventId } : { items }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Error');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el pago');
      setLoading(false);
    }
  }
  return (
    <>
      <button type="button" className={className} onClick={go} disabled={loading || disabled || (!eventId && items.length === 0)}>
        {loading ? 'Abriendo pago…' : label}
      </button>
      {error && <div className="msg err">{error}</div>}
    </>
  );
}

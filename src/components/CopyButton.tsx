'use client';
import { useState } from 'react';

export function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Entrena conmigo en Verion', text: 'Regístrate con mi código:', url: text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* el usuario canceló */
    }
  }
  return (
    <button type="button" className="btn ghost sm" onClick={copy}>
      {done ? '¡Listo!' : label}
    </button>
  );
}

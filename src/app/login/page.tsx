'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [ref, setRef] = useState('');
  const [next, setNext] = useState('/app');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setRef(q.get('ref') ?? '');
    const n = q.get('next');
    if (n && n.startsWith('/') && !n.startsWith('//')) setNext(n);
    if (q.get('error')) setError('El enlace expiró o ya se usó. Pide uno nuevo.');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: { full_name: name, ref: ref.trim().toUpperCase() },
      },
    });
    setLoading(false);
    if (error) setError('No pudimos enviar el correo. Revisa que esté bien escrito.');
    else setSent(true);
  }

  return (
    <main className="phone">
      <div className="top">
        <Link href="/" className="logo">verion<span>.</span></Link>
      </div>
      <div className="page">
        <div className="hello" style={{ fontSize: 40, marginTop: 30 }}>
          Entrena.<br />Recupérate.<br />Pertenece.
        </div>
        <p className="sub" style={{ marginTop: 10 }}>Entra o crea tu cuenta de Verion Wellness Club. Sin contraseñas: te mandamos un enlace a tu correo.</p>

        {sent ? (
          <div className="card">
            <h3>Revisa tu correo 📩</h3>
            <p className="sub" style={{ marginTop: 6 }}>
              Te enviamos un enlace a <b>{email}</b>. Ábrelo desde este mismo dispositivo para entrar.
            </p>
          </div>
        ) : (
          <form className="card" onSubmit={submit}>
            <div className="field">
              <label>Tu nombre (sólo la primera vez)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Martínez" autoComplete="name" />
            </div>
            <div className="field">
              <label>Correo</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" autoComplete="email" />
            </div>
            <div className="field">
              <label>Código de embajador (opcional)</label>
              <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="ANA-1A2B" />
            </div>
            <button className="btn pri" disabled={loading}>{loading ? 'Enviando…' : 'Entrar con mi correo'}</button>
            {error && <div className="msg err">{error}</div>}
          </form>
        )}
      </div>
    </main>
  );
}

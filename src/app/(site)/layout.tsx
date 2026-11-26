import Link from 'next/link';
import { SITE } from '@/config/site';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <header className="snav">
        <div className="wrap">
          <Link href="/" className="logo">verion<span>.</span></Link>
          <nav className="links">
            <Link href="/#servicios">Servicios</Link>
            <Link href="/club">Club Online</Link>
            <Link href="/eventos">Eventos</Link>
            <Link href="/noticias">Noticias</Link>
            <Link href="/#tienda">Tienda</Link>
          </nav>
          <div className="cta">
            <a href={SITE.bookingUrl} className="btn ghost sm">Reservar clase</a>
            <Link href="/app" className="btn pri sm">Entrar al club</Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="sfoot">
        <div className="wrap">
          <div>
            <div className="logo" style={{ color: 'var(--text)' }}>verion<span>.</span></div>
            <div style={{ marginTop: 6 }}>{SITE.name} · {SITE.address}</div>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <Link href="/club">Club Online</Link>
            <Link href="/eventos">Eventos</Link>
            <Link href="/noticias">Noticias</Link>
            <a href={SITE.bookingUrl}>Reservar</a>
            <a href={SITE.instagram} target="_blank" rel="noreferrer">Instagram</a>
          </div>
          <div style={{ width: '100%', fontSize: 12 }}>© {new Date().getFullYear()} {SITE.name}</div>
        </div>
      </footer>
    </div>
  );
}

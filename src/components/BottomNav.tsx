'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/app', label: 'Inicio', d: 'M3 11 12 4l9 7v9H3z' },
  { href: '/app/entrenar', label: 'Entrenar', d: 'M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12' },
  { href: '/app/eventos', label: 'Eventos', d: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4' },
  { href: '/app/wellness', label: 'Wellness', d: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z' },
  { href: '/app/tienda', label: 'Tienda', d: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2' },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom">
      {items.map((it) => {
        const on = it.href === '/app' ? path === '/app' || path.startsWith('/app/retos') : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={on ? 'on' : ''}>
            <svg fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24"><path d={it.d} /></svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

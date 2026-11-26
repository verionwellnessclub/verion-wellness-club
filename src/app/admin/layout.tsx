import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/supabase/server';

const LINKS = [
  ['/admin', 'Resumen'],
  ['/admin/ejercicios', 'Ejercicios y videos'],
  ['/admin/programas', 'Programas'],
  ['/admin/clientes', 'Clientes online'],
  ['/admin/eventos', 'Eventos'],
  ['/admin/noticias', 'Noticias'],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect('/login?next=/admin');
  if (!profile || profile.role === 'member') redirect('/app');
  return (
    <div className="admin">
      <nav className="anav">
        <Link href="/admin" className="logo" style={{ marginRight: 14 }}>verion<span>.</span></Link>
        {LINKS.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        <Link href="/app" style={{ marginLeft: 'auto' }}>Ir a la app →</Link>
      </nav>
      {children}
    </div>
  );
}

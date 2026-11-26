import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { getSessionProfile } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect('/login?next=/app');
  const initials = (profile?.full_name ?? 'V').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="phone">
      <header className="top">
        <Link href="/app" className="logo">verion<span>.</span></Link>
        <div className="row">
          {profile && profile.role !== 'member' && <Link href="/admin" className="tag dark">Admin</Link>}
          <Link href="/app/perfil" className="avatar" aria-label="Mi perfil">{initials}</Link>
        </div>
      </header>
      {children}
      <BottomNav />
    </div>
  );
}

import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import { SITE } from '@/config/site';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE.domain}`),
  title: { default: `${SITE.name} · ${SITE.city}`, template: `%s · ${SITE.short}` },
  description: SITE.description,
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: SITE.short, statusBarStyle: 'black-translucent' },
  openGraph: { title: SITE.name, description: SITE.description, locale: 'es_MX', type: 'website' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = { themeColor: '#0E0E10', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}

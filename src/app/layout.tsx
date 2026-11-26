import type { Metadata, Viewport } from 'next';
import { SITE } from '@/config/site';
import './globals.css';

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
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

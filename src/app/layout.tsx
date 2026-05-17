import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Manrope, JetBrains_Mono } from 'next/font/google';
import { auth } from '@/lib/auth';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'sonner';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
const body = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const viewport: Viewport = {
  themeColor: '#E89B4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'ТамБуду — события в Самаре',
  description:
    'Агрегатор городских событий в Самаре. Находите лекции, мастер-классы, концерты, выставки и другие мероприятия рядом с вами.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ТамБуду',
  },
  icons: [
    { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
    { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
    { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    {
      url: '/icons/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
      rel: 'apple-touch-icon',
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="min-h-screen flex flex-col font-body antialiased bg-background text-foreground">
        <SessionProvider session={session}>
          <ThemeProvider>
            <Header session={session} />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

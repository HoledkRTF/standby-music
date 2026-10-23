import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Apple StandBy Music',
  description: 'Apple StandBy Music Player for YouTube Music',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StandBy Music',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-[100dvh] w-full bg-black text-white antialiased overflow-x-hidden selection:bg-white/20 select-none">
        {children}
      </body>
    </html>
  );
}

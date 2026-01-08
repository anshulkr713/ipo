import { Playfair_Display, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-playfair',
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-ibm-plex',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
});

export const metadata = {
  title: 'IPO Tracker - Market Intelligence',
  description: 'Comprehensive IPO data, Grey Market Premium tracking, and shareholder analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${ibmPlex.variable} ${jetbrains.variable}`} suppressHydrationWarning>
        <Navigation />
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}

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

import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0f',
};

export const metadata: Metadata = {
  title: {
    default: 'IPO Tracker - Live GMP, Subscription & Allotment Status',
    template: '%s | IPO Tracker',
  },
  description: 'Track live IPO Grey Market Premium (GMP), subscription status, allotment dates, and get expert analysis. Your comprehensive IPO investment companion for informed decisions.',
  keywords: ['IPO', 'Grey Market Premium', 'GMP', 'IPO subscription', 'IPO allotment', 'upcoming IPO', 'IPO tracker', 'stock market', 'NSE IPO', 'BSE IPO'],
  authors: [{ name: 'IPO Tracker' }],
  creator: 'IPO Tracker',
  publisher: 'IPO Tracker',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'IPO Tracker',
    title: 'IPO Tracker - Live GMP, Subscription & Allotment Status',
    description: 'Track live IPO Grey Market Premium (GMP), subscription status, allotment dates, and get expert analysis.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IPO Tracker - Your IPO Investment Companion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPO Tracker - Live GMP, Subscription & Allotment Status',
    description: 'Track live IPO Grey Market Premium (GMP), subscription status, allotment dates, and get expert analysis.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://ipotracker.in',
  },
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

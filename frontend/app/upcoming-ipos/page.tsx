import type { Metadata } from 'next';
import UpcomingIPOsClient from './UpcomingIPOsClient';

export const metadata: Metadata = {
    title: 'Upcoming IPOs 2026 - Complete List with Dates, Price & GMP',
    description: 'Complete list of upcoming IPOs in India with open dates, close dates, price bands, lot sizes, and Grey Market Premium (GMP). Stay updated with the latest IPO launches.',
    keywords: ['upcoming IPO', 'IPO 2026', 'new IPO', 'IPO open date', 'IPO price band', 'IPO list', 'NSE IPO', 'BSE IPO', 'mainboard IPO', 'SME IPO'],
    openGraph: {
        title: 'Upcoming IPOs 2026 - Complete List with Dates, Price & GMP',
        description: 'Complete list of upcoming IPOs in India with open dates, close dates, price bands, lot sizes, and Grey Market Premium.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Upcoming IPOs 2026 - Complete List with Dates, Price & GMP',
        description: 'Complete list of upcoming IPOs in India with open dates, close dates, price bands, and GMP.',
    },
};

export const revalidate = 3600; // Revalidate every 1 hour

export default function UpcomingIPOsPage() {
    return <UpcomingIPOsClient />;
}

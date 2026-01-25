import type { Metadata } from 'next';
import GMPClient from './GMPClient';

export const metadata: Metadata = {
    title: 'IPO Grey Market Premium (GMP) - Live GMP Rates Today',
    description: 'Check live IPO Grey Market Premium (GMP) rates for all upcoming and recent IPOs. Track GMP trends, expected listing prices, and make informed investment decisions.',
    keywords: ['IPO GMP', 'Grey Market Premium', 'GMP today', 'IPO GMP live', 'IPO expected listing price', 'Kostak rate'],
    openGraph: {
        title: 'IPO Grey Market Premium (GMP) - Live GMP Rates Today',
        description: 'Check live IPO Grey Market Premium (GMP) rates for all upcoming and recent IPOs. Track GMP trends and expected listing prices.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'IPO Grey Market Premium (GMP) - Live GMP Rates Today',
        description: 'Check live IPO Grey Market Premium (GMP) rates for all upcoming and recent IPOs.',
    },
};

export const revalidate = 3600; // Revalidate every 1 hour

export default function GMPPage() {
    return <GMPClient />;
}

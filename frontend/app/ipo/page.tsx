// app/ipo/page.tsx - IPO Landing Page (Lists all IPOs)

import { Metadata } from 'next';
import IPOListingClient from './IPOListingClient';

export const metadata: Metadata = {
    title: 'Analyse All IPOs - GMP, Subscription, Allotment Status | IPO Tracker',
    description: 'Comprehensive analysis of all IPOs in India. Check live GMP, subscription status, allotment probability, and expert recommendations for every IPO.',
    keywords: [
        'IPO analysis',
        'IPO list',
        'all IPOs',
        'IPO GMP',
        'IPO subscription',
        'current IPOs',
        'upcoming IPOs',
        'IPO review',
    ],
    openGraph: {
        title: 'Analyse All IPOs - Complete IPO List',
        description: 'Complete list of all IPOs with GMP, subscription, and allotment details',
        type: 'website',
        url: 'https://ipotracker.in/ipo',
    },
};

export default function IPOListingPage() {
    return <IPOListingClient />;
}
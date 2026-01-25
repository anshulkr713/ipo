import type { Metadata } from 'next';
import AllotmentClient from './AllotmentClient';

export const metadata: Metadata = {
    title: 'Check IPO Allotment Status - All Registrar Links',
    description: 'Check your IPO allotment status online. Quick links to all registrar websites including Link Intime, KFin Tech, Bigshare Services, and more. Track your IPO application status easily.',
    keywords: ['IPO allotment status', 'check IPO allotment', 'IPO allotment result', 'Link Intime', 'KFin Tech', 'IPO registrar', 'BSE IPO status', 'NSE IPO status'],
    openGraph: {
        title: 'Check IPO Allotment Status - All Registrar Links',
        description: 'Check your IPO allotment status online. Quick links to all registrar websites.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Check IPO Allotment Status - All Registrar Links',
        description: 'Check your IPO allotment status online with quick registrar links.',
    },
};

export const revalidate = 3600; // Revalidate every 1 hour

export default function AllotmentPage() {
    return <AllotmentClient />;
}

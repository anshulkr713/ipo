import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'IPO Allotment Calculator - Check Your Allotment Probability',
    description: 'Calculate your IPO allotment probability based on subscription data and category. Understand your chances of getting allotment in retail, HNI, and QIB categories.',
    keywords: ['IPO allotment calculator', 'allotment probability', 'IPO lottery', 'IPO subscription', 'retail allotment', 'HNI allotment'],
    openGraph: {
        title: 'IPO Allotment Calculator - Check Your Allotment Probability',
        description: 'Calculate your IPO allotment probability based on subscription data and category.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'IPO Allotment Calculator - Check Your Allotment Probability',
        description: 'Calculate your IPO allotment probability based on subscription data.',
    },
};

export default function AllotmentCalculatorPage() {
    return (
        <div>
            <h1>Allotment Calculator</h1>
        </div>
    );
}

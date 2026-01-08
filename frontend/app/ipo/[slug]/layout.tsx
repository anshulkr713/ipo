import { Metadata } from 'next';

// Mock IPO data for metadata generation - in production, fetch from API
const getIPOData = async (slug: string) => {
    const companyName = slug
        .replace(/-ipo-gmp-allotment-subscription$/, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return {
        companyName,
        gmp: 485,
        gmpPercentage: 96.5,
        subscription: 69.43,
        priceMin: 475,
        priceMax: 500,
        openDate: '2024-11-22',
        closeDate: '2024-11-24',
        allotmentDate: '2024-11-29',
        listingDate: '2024-11-30',
        registrar: 'Link Intime India Pvt Ltd',
        registrarLink: 'https://linkintime.co.in',
    };
};

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const ipo = await getIPOData(slug);
    const currentYear = new Date().getFullYear();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ipotracker.in';
    const pageUrl = `${baseUrl}/ipo/${slug}`;
    const logoUrl = `${baseUrl}/images/ipo/${slug}-logo.png`;

    return {
        title: `${ipo.companyName} IPO GMP, Allotment Status, Subscription, Review ${currentYear}`,
        description: `${ipo.companyName} IPO: Live GMP ₹${ipo.gmp} (+${ipo.gmpPercentage}%), subscription ${ipo.subscription}x. Check allotment status, issue date, price band ₹${ipo.priceMin}-${ipo.priceMax}, grey market premium & expert review.`,
        keywords: [
            `${ipo.companyName.toLowerCase()} ipo`,
            `${ipo.companyName.toLowerCase()} ipo gmp`,
            `${ipo.companyName.toLowerCase()} ipo allotment status`,
            `${ipo.companyName.toLowerCase()} ipo subscription`,
            `${ipo.companyName.toLowerCase()} grey market premium`,
            `${ipo.companyName.toLowerCase()} ipo listing date`,
            `${ipo.companyName.toLowerCase()} ipo review`,
            'ipo gmp today',
            'upcoming ipo',
            'ipo allotment',
        ],
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
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            title: `${ipo.companyName} IPO - GMP ₹${ipo.gmp}, Subscription ${ipo.subscription}x`,
            description: `Get live updates on ${ipo.companyName} IPO. Current GMP, subscription status, allotment date & detailed review.`,
            url: pageUrl,
            siteName: 'IPO Tracker',
            images: [
                {
                    url: logoUrl,
                    width: 1200,
                    height: 630,
                    alt: `${ipo.companyName} IPO`,
                },
            ],
            locale: 'en_IN',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${ipo.companyName} IPO - Live GMP & Subscription Status`,
            description: `Track ${ipo.companyName} IPO: GMP ₹${ipo.gmp}, Subscription ${ipo.subscription}x`,
            images: [logoUrl],
            creator: '@ipotracker',
        },
        other: {
            'article:published_time': new Date().toISOString(),
            'article:modified_time': new Date().toISOString(),
            'article:section': 'Finance',
            'article:tag': 'IPO, Stock Market, Investment',
        },
    };
}

export default function IPOLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

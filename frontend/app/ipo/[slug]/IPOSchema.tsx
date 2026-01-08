// JSON-LD Schema Markup Component for IPO Detail Pages

interface IPOSchemaProps {
    companyName: string;
    gmp: number;
    gmpPercentage: number;
    subscription: number;
    priceMin: number;
    priceMax: number;
    openDate: string;
    closeDate: string;
    allotmentDate: string;
    listingDate: string;
    registrar: string;
    registrarLink: string;
    faqs: { q: string; a: string }[];
    slug: string;
}

export default function IPOSchema({
    companyName,
    gmp,
    gmpPercentage,
    subscription,
    priceMin,
    priceMax,
    openDate,
    closeDate,
    allotmentDate,
    listingDate,
    registrar,
    registrarLink,
    faqs,
    slug,
}: IPOSchemaProps) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ipotracker.in';
    const pageUrl = `${baseUrl}/ipo/${slug}`;
    const logoUrl = `${baseUrl}/images/logo.png`;
    const now = new Date().toISOString();

    // FinancialProduct Schema
    const financialProductSchema = {
        '@context': 'https://schema.org',
        '@type': 'FinancialProduct',
        name: `${companyName} IPO`,
        description: `${companyName} Initial Public Offering with live GMP updates, subscription status, and allotment details`,
        url: pageUrl,
        provider: {
            '@type': 'Organization',
            name: companyName,
        },
        offers: {
            '@type': 'Offer',
            price: priceMax,
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            priceValidUntil: closeDate,
            seller: {
                '@type': 'Organization',
                name: companyName,
            },
        },
        audience: {
            '@type': 'PeopleAudience',
            audienceType: 'Retail Investors, Institutional Investors',
        },
    };

    // FAQ Schema
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: `What is the ${companyName} IPO GMP today?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `The current Grey Market Premium (GMP) for ${companyName} IPO is ₹${gmp}, indicating a premium of ${gmpPercentage}% over the issue price.`,
                },
            },
            {
                '@type': 'Question',
                name: `When is ${companyName} IPO opening and closing?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `${companyName} IPO opens on ${openDate} and closes on ${closeDate}.`,
                },
            },
            {
                '@type': 'Question',
                name: `How to check ${companyName} IPO allotment status?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `Check ${companyName} IPO allotment status on ${registrar} website at ${registrarLink} using your PAN number or application number.`,
                },
            },
            ...faqs.map(faq => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.a,
                },
            })),
        ],
    };

    // Article Schema
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${companyName} IPO Review: GMP, Subscription & Allotment Details`,
        description: `Comprehensive analysis of ${companyName} IPO including grey market premium, subscription status, financials, and investment recommendation`,
        image: logoUrl,
        datePublished: now,
        dateModified: now,
        author: {
            '@type': 'Organization',
            name: 'IPO Tracker',
        },
        publisher: {
            '@type': 'Organization',
            name: 'IPO Tracker',
            logo: {
                '@type': 'ImageObject',
                url: logoUrl,
            },
        },
    };

    // Breadcrumb Schema
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: baseUrl,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'IPO',
                item: `${baseUrl}/upcoming-ipos`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: `${companyName} IPO`,
                item: pageUrl,
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(financialProductSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
        </>
    );
}

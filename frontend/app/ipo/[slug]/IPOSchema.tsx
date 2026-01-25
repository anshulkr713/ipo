import React from 'react';

type IPOSchemaProps = {
    companyName: string;
    slug: string;
    gmp: number;
    priceMin: number | null;
    priceMax: number | null;
    openDate: string | Date;
    closeDate: string | Date;
    allotmentDate: string | Date | null;
    listingDate: string | Date | null;
    registrar?: string | null;
    image?: string;
};

const IPOSchema = ({
    companyName,
    slug,
    gmp,
    priceMin,
    priceMax,
    openDate,
    closeDate,
    allotmentDate,
    listingDate,
    registrar,
    image
}: IPOSchemaProps) => {
    // Base URL of your website (Replace with your actual domain)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yourwebsite.com';
    const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug;

    // Financial Product Schema
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "FinancialProduct",
        "name": `${companyName} IPO`,
        "description": `${companyName} IPO GMP today is ₹${gmp}. Check subscription status, allotment date, and review.`,
        "brand": {
            "@type": "Brand",
            "name": companyName
        },
        "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": priceMax || priceMin || 0,
            "availability": "https://schema.org/InStock",
            "validFrom": new Date(openDate).toISOString(),
            "validThrough": new Date(closeDate).toISOString(),
            "url": `${siteUrl}/ipo/${cleanSlug}`
        },
        "datePublished": new Date(openDate).toISOString(),
        "organizer": {
            "@type": "Organization",
            "name": registrar || "Registrar"
        },
        // Important dates for Google Events/Financial
        "startDate": new Date(openDate).toISOString(),
        "endDate": new Date(closeDate).toISOString(),
        ...(image && { "image": image })
    };

    // Breadcrumb Schema
    const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${siteUrl}`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "IPOs",
                "item": `${siteUrl}/ipos`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": `${companyName} IPO`,
                "item": `${siteUrl}/ipo/${cleanSlug}`
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
            />
        </>
    );
};

export default IPOSchema;
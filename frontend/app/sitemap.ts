import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ipotracker.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/gmp`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/upcoming-ipos`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/allotment`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/portfolio-optimizer`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/allotment-calculator`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
    ];

    // Dynamic IPO pages - fetch from API
    let ipoPages: MetadataRoute.Sitemap = [];

    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/ipos/all`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (response.ok) {
            const ipos = await response.json();
            ipoPages = ipos.map((ipo: { slug?: string; ipo_name?: string; updated_at?: string }) => {
                const slug = ipo.slug || ipo.ipo_name?.toLowerCase().replace(/\s+/g, '-') + '-ipo-gmp-allotment-subscription';
                return {
                    url: `${BASE_URL}/ipo/${slug}`,
                    lastModified: ipo.updated_at ? new Date(ipo.updated_at) : new Date(),
                    changeFrequency: 'daily' as const,
                    priority: 0.8,
                };
            });
        }
    } catch (error) {
        console.error('Error fetching IPOs for sitemap:', error);
    }

    return [...staticPages, ...ipoPages];
}

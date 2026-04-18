import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ipotarget.com';

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

    // Dynamic IPO pages - fetch from Supabase
    let ipoPages: MetadataRoute.Sitemap = [];

    try {
        const { data: ipos, error } = await supabase
            .from('ipos')
            .select('slug, ipo_name, updated_at');
            
        if (!error && ipos) {
            ipoPages = ipos.map((ipo) => {
                const slug = ipo.slug || (ipo.ipo_name ? ipo.ipo_name.toLowerCase().replace(/\s+/g, '-') + '-ipo-gmp-allotment-subscription' : undefined);
                if (!slug) return null;
                return {
                    url: `${BASE_URL}/ipo/${slug}`,
                    lastModified: ipo.updated_at ? new Date(ipo.updated_at) : new Date(),
                    changeFrequency: 'daily' as const,
                    priority: 0.8,
                };
            }).filter(Boolean) as MetadataRoute.Sitemap;
        }
    } catch (error) {
        console.error('Error fetching IPOs for sitemap:', error);
    }

    return [...staticPages, ...ipoPages];
}

import { supabase, type IPO } from './supabase';

// ============================================
// Core IPO Fetching Functions
// ============================================

/**
 * Fetch a single IPO by slug with all related data
 */
export async function fetchIPOBySlug(slug: string): Promise<IPO | null> {
    const { data, error } = await supabase
        .from('ipos')
        .select(`*, ipo_comments(*)`)
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching IPO by slug:', error);
        return null;
    }
    return data;
}

/**
 * Fetch upcoming IPOs with latest GMP and subscription data
 */
export async function fetchUpcomingIPOs() {
    const { data, error } = await supabase
        .from('ipos')
        .select(`*`)
        .eq('status', 'upcoming')
        .order('open_date', { ascending: true });

    if (error) {
        console.error('Error fetching upcoming IPOs:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch GMP data for all active IPOs
 */
export async function fetchGMPData() {
    const { data, error } = await supabase
        .from('ipos')
        .select(`*`)
        .in('status', ['open', 'upcoming', 'closed'])
        .order('open_date', { ascending: false });

    if (error) {
        console.error('Error fetching GMP data:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch allotment data
 */
export async function fetchAllotmentLinks() {
    const { data, error } = await supabase
        .from('ipos')
        .select(`*`)
        .eq('allotment_link_active', true)
        .not('allotment_link', 'is', null)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching allotment links:', error);
        return [];
    }
    // Map to structure old code expects
    return data.map(ipo => ({
        registrar_link: ipo.allotment_link,
        is_active: ipo.allotment_link_active,
        ipos: ipo
    }));
}

/**
 * Fetch combined IPO data for dashboard
 */
export async function fetchCombinedIPOData() {
    const { data, error } = await supabase
        .from('ipos')
        .select(`*`)
        .in('status', ['upcoming', 'open', 'closed'])
        .order('open_date', { ascending: true });

    if (error) {
        console.error('Error fetching combined IPO data:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch featured IPOs with GMP and subscription data
 */
export async function fetchFeaturedIPOs() {
    const { data, error } = await supabase
        .from('ipos')
        .select(`*`)
        .eq('is_featured', true)
        .in('status', ['open', 'upcoming'])
        .order('trending_score', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error fetching featured IPOs:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch currently open IPOs
 */
export async function fetchOpenIPOs() {
    const { data, error } = await supabase
        .from('ipos')
        .select(`*`)
        .eq('status', 'open')
        .order('close_date', { ascending: true });

    if (error) {
        console.error('Error fetching open IPOs:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch closed IPOs
 */
export async function fetchClosedIPOs() {
    const { data, error } = await supabase
        .from('ipos')
        .select(`*`)
        .eq('status', 'closed')
        .order('close_date', { ascending: false });

    if (error) {
        console.error('Error fetching closed IPOs:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch all IPOs
 */
export async function fetchAllIPOs() {
    const { data, error } = await supabase
        .from('ipos')
        .select(`*`)
        .order('open_date', { ascending: false });

    if (error) {
        console.error('Error fetching all IPOs:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch all IPO slugs for static path generation
 */
export async function fetchAllIPOSlugs() {
    const { data, error } = await supabase
        .from('ipos')
        .select('slug');

    if (error) {
        console.error('Error fetching IPO slugs:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch calendar events
 */
export async function fetchCalendarEvents(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    try {
        const { data, error } = await supabase
            .from('ipos')
            .select('*')
            .or(`open_date.gte.${startDate},close_date.gte.${startDate},open_date.lte.${endDate},close_date.lte.${endDate}`);

        if (error) {
            console.error('Error fetching calendar events:', error);
            return [];
        }
        
        const events: any[] = [];
        for (const ipo of data || []) {
            if (ipo.open_date >= startDate && ipo.open_date <= endDate) {
                events.push({
                    event_date: ipo.open_date,
                    event_title: `Opens: ${ipo.company_name || ipo.ipo_name}`,
                    event_type: 'IPO Opens',
                    ipos: { slug: ipo.slug }
                });
            }
            if (ipo.close_date >= startDate && ipo.close_date <= endDate) {
                events.push({
                    event_date: ipo.close_date,
                    event_title: `Closes: ${ipo.company_name || ipo.ipo_name}`,
                    event_type: 'IPO Closes',
                    ipos: { slug: ipo.slug }
                });
            }
            if (ipo.listing_date && ipo.listing_date >= startDate && ipo.listing_date <= endDate) {
                events.push({
                    event_date: ipo.listing_date,
                    event_title: `Listing: ${ipo.company_name || ipo.ipo_name}`,
                    event_type: 'Listing Date',
                    ipos: { slug: ipo.slug }
                });
            }
        }
        events.sort((a, b) => a.event_date.localeCompare(b.event_date));
        return events;
    } catch {
        return [];
    }
}

/**
 * Fetch IPOs for comparison
 */
export async function fetchAllIPOsForComparison(category: string = 'all') {
    let query = supabase
        .from('ipos')
        .select(`*`)
        .in('status', ['open', 'upcoming', 'closed']);

    if (category !== 'all') {
        query = query.eq('category', category);
    }

    const { data, error } = await query.order('open_date', { ascending: false });

    if (error) {
        console.error('Error fetching IPOs for comparison:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch shareholding data
 */
export async function fetchShareholdingData() {
    const { data, error } = await supabase
        .from('ipos')
        .select(`*`)
        .not('shareholding', 'is', null)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching shareholding data:', error);
        return [];
    }
    
    // Map to old structure
    const results: any[] = [];
    for (const ipo of data || []) {
        for (const sh of ipo.shareholding || []) {
            results.push({
                ...sh,
                ipos: ipo
            });
        }
    }
    return results;
}

// ============================================
// Helper Functions to Extract Latest Data
// ============================================

/**
 * Shim for legacy components
 * Takes an IPO object
 */
export function getLatestGmp(ipo?: any): any {
    if (!ipo) return null;
    return {
        gmp_amount: ipo.current_gmp || 0,
        gmp_percentage: ipo.gmp_percentage || 0,
        issue_price: ipo.max_price || 0
    };
}

/**
 * Shim for legacy components
 */
export function getLatestSubscription(ipo?: any): any {
    if (!ipo) return null;
    return {
        subscription_total: ipo.subscription_total || 0,
        subscription_qib: ipo.subscription_qib || 0,
        subscription_nii: ipo.subscription_nii || 0,
        subscription_retail: ipo.subscription_retail || 0,
        subscription_employee: 0
    };
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate allotment probability
 */
export function calculateAllotmentProbability(
    category: 'retail' | 'sNII' | 'bNII',
    subscription: number,
    lots: number
): number {
    if (subscription <= 1) return 100;

    if (category === 'retail') {
        if (subscription < 2) return 95;
        if (subscription < 5) return 60;
        if (subscription < 10) return 30;
        if (subscription < 20) return 15;
        return Math.max(5, 100 / subscription);
    }

    const baseProb = Math.min(100, (100 / subscription) * lots);

    if (category === 'sNII') {
        return Math.max(10, baseProb * 1.2);
    }

    return Math.max(5, baseProb * 0.8);
}

/**
 * Calculate expected returns
 */
export function calculateExpectedReturns(
    investment: number,
    gmp: number,
    issuePrice: number,
    lotSize: number,
    category: 'retail' | 'sNII' | 'bNII',
    subscription: number
) {
    const numLots = Math.floor(investment / (issuePrice * lotSize));
    const numShares = numLots * lotSize;
    const totalInvestment = numShares * issuePrice;

    const expectedListingPrice = issuePrice + gmp;
    const profitPerShare = gmp;
    const totalProfit = profitPerShare * numShares;
    const profitPercentage = (profitPerShare / issuePrice) * 100;

    const allotmentProb = calculateAllotmentProbability(category, subscription, numLots);
    const expectedProfit = (totalProfit * allotmentProb) / 100;

    return {
        numLots,
        numShares,
        totalInvestment,
        expectedListingPrice,
        profitPerShare,
        totalProfit,
        profitPercentage,
        allotmentProb,
        expectedProfit,
        recommendation: getRecommendation(profitPercentage, allotmentProb, subscription)
    };
}

function getRecommendation(profitPercentage: number, allotmentProb: number, subscription: number) {
    if (profitPercentage > 30 && allotmentProb > 50) {
        return { text: 'Strong Buy', color: '#22c55e', icon: '🚀' };
    }
    if (profitPercentage > 15 && allotmentProb > 30) {
        return { text: 'Buy', color: '#4ade80', icon: '✅' };
    }
    if (profitPercentage > 0 && subscription < 10) {
        return { text: 'Consider', color: '#facc15', icon: '⚠️' };
    }
    if (profitPercentage < 0) {
        return { text: 'Avoid', color: '#ef4444', icon: '❌' };
    }
    return { text: 'Neutral', color: '#9ca3af', icon: '➖' };
}

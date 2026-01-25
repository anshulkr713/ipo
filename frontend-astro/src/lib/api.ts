import { supabase, type IPO, type IPOWithDetails, type IPOAllotment, type IPOGmp, type IPOSubscription } from './supabase';

// ============================================
// Core IPO Fetching Functions
// ============================================

/**
 * Fetch a single IPO by slug with all related data
 */
export async function fetchIPOBySlug(slug: string): Promise<IPOWithDetails | null> {
    const { data, error } = await supabase
        .from('ipos')
        .select(`
            *,
            ipo_gmp(*),
            ipo_subscriptions(*),
            ipo_timeline(*),
            ipo_allotment(*),
            ipo_financials(*),
            ipo_reviews(*),
            ipo_documents(*),
            ipo_shareholding(*),
            ipo_reservations(*),
            ipo_comparables(*),
            ipo_anchor_investors(*),
            ipo_objectives(*),
            ipo_technical_analysis(*),
            ipo_faqs(*)
        `)
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
        .select(`
            *,
            ipo_gmp(*),
            ipo_subscriptions(*)
        `)
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
        .select(`
            *,
            ipo_gmp(*),
            ipo_subscriptions(*)
        `)
        .in('status', ['open', 'upcoming', 'closed'])
        .order('open_date', { ascending: false });

    if (error) {
        console.error('Error fetching GMP data:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch allotment data from ipo_allotment table
 */
export async function fetchAllotmentLinks() {
    const { data, error } = await supabase
        .from('ipo_allotment')
        .select(`
            *,
            ipos(ipo_name, company_name, slug, category, status)
        `)
        .eq('is_active', true)
        .not('registrar_link', 'is', null)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching allotment links:', error);
        return [];
    }
    return data || [];
}

/**
 * Fetch combined IPO data for dashboard
 */
export async function fetchCombinedIPOData() {
    const { data, error } = await supabase
        .from('ipos')
        .select(`
            *,
            ipo_gmp(*),
            ipo_subscriptions(*)
        `)
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
        .select(`
            *,
            ipo_gmp(*),
            ipo_subscriptions(*)
        `)
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
        .select(`
            *,
            ipo_gmp(*),
            ipo_subscriptions(*)
        `)
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
        .select(`
            *,
            ipo_gmp(*),
            ipo_subscriptions(*)
        `)
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
        .select(`
            *,
            ipo_gmp(*),
            ipo_subscriptions(*)
        `)
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
 * Fetch calendar events from timeline
 */
export async function fetchCalendarEvents(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    try {
        const { data, error } = await supabase
            .from('ipo_timeline')
            .select(`
                *,
                ipos(ipo_name, company_name, category, slug)
            `)
            .gte('event_date', startDate)
            .lte('event_date', endDate)
            .order('event_date', { ascending: true });

        if (error) {
            console.error('Error fetching calendar events:', error);
            return [];
        }
        return data || [];
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
        .select(`
            *,
            ipo_gmp(*),
            ipo_subscriptions(*)
        `)
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
        .from('ipo_shareholding')
        .select(`
            *,
            ipos(ipo_name, company_name, slug, category, status)
        `)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching shareholding data:', error);
        return [];
    }
    return data || [];
}

// ============================================
// Helper Functions to Extract Latest Data
// ============================================

/**
 * Get the latest GMP from an array of GMP records
 */
export function getLatestGmp(gmpRecords?: IPOGmp[]): IPOGmp | null {
    if (!gmpRecords || gmpRecords.length === 0) return null;
    return gmpRecords.find(g => g.is_latest) || gmpRecords[0];
}

/**
 * Get the latest subscription from an array of subscription records
 */
export function getLatestSubscription(subRecords?: IPOSubscription[]): IPOSubscription | null {
    if (!subRecords || subRecords.length === 0) return null;
    return subRecords.find(s => s.is_latest) || subRecords[0];
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

// frontend/lib/api.ts
import { supabase } from './supabase';

// ============================================
// EXISTING FUNCTIONS (Keep these as they are)
// ============================================

export async function fetchUpcomingIPOs() {
    const { data, error } = await supabase
        .from('ipos')
        .select('*')
        .eq('status', 'upcoming')
        .order('open_date', { ascending: true });

    if (error) {
        console.error('Error fetching upcoming IPOs:', error);
        return [];
    }
    return data || [];
}

export async function fetchGMPData() {
    const { data, error } = await supabase
        .from('ipos')
        .select('*')
        .in('status', ['open', 'upcoming', 'closed'])
        .order('listing_date', { ascending: true });

    if (error) {
        console.error('Error fetching GMP data:', error);
        return [];
    }
    return data || [];
}

export async function fetchAllotmentLinks() {
    const { data, error } = await supabase
        .from('ipo_allotment_links')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching allotment links:', error);
        return [];
    }
    return data || [];
}

export async function fetchShareholderData() {
    // Query from ipos table since shareholder_intel table doesn't exist
    // This returns parent company and regulatory filing data
    const { data, error } = await supabase
        .from('ipos')
        .select('id, ipo_name, parent_company, category, drhp_status, rhp_status, issue_size_cr')
        .in('status', ['upcoming', 'open', 'closed', 'listed'])
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching shareholder data:', error);
        return [];
    }
    return data || [];
}

// ============================================
// NEW FUNCTIONS FOR HOMEPAGE REDESIGN
// ============================================

export async function fetchCombinedIPOData() {
    const { data, error } = await supabase
        .from('ipos')
        .select('*')
        .in('status', ['upcoming', 'open', 'closed'])
        .order('open_date', { ascending: true });

    if (error) {
        console.error('Error fetching combined IPO data:', error);
        return [];
    }
    return data || [];
}

export async function fetchFeaturedIPOs() {
    const { data, error } = await supabase
        .from('ipos')
        .select('*')
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

export async function fetchMarketSentiment() {
    const { data, error } = await supabase
        .from('market_sentiment')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching market sentiment:', error);
        return null;
    }
    return data;
}

export async function fetchOpenIPOs() {
    const { data, error } = await supabase
        .from('ipos')
        .select('*')
        .eq('status', 'open')
        .order('close_date', { ascending: true });

    if (error) {
        console.error('Error fetching open IPOs:', error);
        return [];
    }
    return data || [];
}

export async function fetchClosingSoonIPOs() {
    const today = new Date().toISOString().split('T')[0];
    const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('ipos')
        .select('*')
        .eq('status', 'open')
        .lte('close_date', twoDaysLater)
        .gte('close_date', today)
        .order('close_date', { ascending: true });

    if (error) {
        console.error('Error fetching closing soon IPOs:', error);
        return [];
    }
    return data || [];
}

export async function fetchRecentlyListedIPOs() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('ipos')
        .select('*')
        .eq('status', 'listed')
        .gte('listing_date', thirtyDaysAgo)
        .order('listing_date', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching recently listed IPOs:', error);
        return [];
    }
    return data || [];
}

export async function fetchUpcomingThisWeek() {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('ipos')
        .select('*')
        .eq('status', 'upcoming')
        .gte('open_date', today)
        .lte('open_date', nextWeek)
        .order('open_date', { ascending: true });

    if (error) {
        console.error('Error fetching upcoming IPOs this week:', error);
        return [];
    }
    return data || [];
}

export async function fetchCalendarEvents(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('ipo_calendar_events')
        .select(`
            *,
            ipos (
                ipo_name,
                company_name,
                category,
                slug
            )
        `)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true });

    if (error) {
        console.error('Error fetching calendar events:', error);
        return [];
    }
    return data || [];
}

export async function fetchAllIPOsForComparison(category: string = 'all') {
    let query = supabase
        .from('ipos')
        .select('*')
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

// Calculate allotment probability
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

// Calculate expected returns
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

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export function subscribeToIPOUpdates(callback: (payload: any) => void) {
    const subscription = supabase
        .channel('ipos-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'ipos'
            },
            (payload) => {
                console.log('IPO table changed:', payload);
                callback(payload);
            }
        )
        .subscribe();

    return subscription;
}
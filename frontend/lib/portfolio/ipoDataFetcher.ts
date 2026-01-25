// ipoDataFetcher.ts - Fetch live IPO data from your Supabase

import { supabase } from '../supabase';
import { IPO } from './types';
import { getLatestGmp, getLatestSubscription } from '../api';

/**
 * Fetch all currently open IPOs with live subscription and GMP data
 */
export async function fetchOpenIPOs(): Promise<IPO[]> {
    try {
        const { data, error } = await supabase
            .from('ipos')
            .select(`
                *,
                ipo_gmp(*),
                ipo_subscriptions(*)
            `)
            .eq('status', 'open')
            .order('open_date', { ascending: false });

        if (error) {
            console.error('Error fetching IPOs:', error.message || error);
            return [];
        }

        if (!data || data.length === 0) {
            console.log('No open IPOs found');
            return [];
        }

        // Transform to IPO type with proper defaults
        return data.map(ipo => {
            // Extract latest GMP and subscription from nested arrays
            const latestGmp = getLatestGmp(ipo.ipo_gmp);
            const latestSub = getLatestSubscription(ipo.ipo_subscriptions);

            return {
                slug: ipo.slug || '',
                ipo_name: ipo.ipo_name || '',
                company_name: ipo.company_name || ipo.ipo_name || '',
                category: ipo.category || 'Mainboard',
                min_price: ipo.min_price || 0,
                max_price: ipo.max_price || 0,
                lot_size: ipo.lot_size || 1,
                issue_size_cr: ipo.issue_size_cr || 0,

                // Subscription data from nested array
                subscription_retail: latestSub?.subscription_retail || 0,
                subscription_nii: latestSub?.subscription_nii || 0,
                subscription_bnii: latestSub?.subscription_bhni || latestSub?.subscription_nii || 0,
                subscription_qib: latestSub?.subscription_qib || 0,
                subscription_total: latestSub?.subscription_total || 0,
                subscription_updated_at: latestSub?.recorded_at,
                subscription_shni: latestSub?.subscription_shni || 0,
                subscription_bhni: latestSub?.subscription_bhni || 0,

                // GMP data from nested array
                gmp_amount: latestGmp?.gmp_amount || 0,
                gmp_percentage: latestGmp?.gmp_percentage || 0,
                expected_listing_price: latestGmp?.estimated_listing_price || (ipo.max_price + (latestGmp?.gmp_amount || 0)),
                gmp_updated_at: latestGmp?.recorded_at,

                open_date: ipo.open_date || '',
                close_date: ipo.close_date || '',
                listing_date: ipo.listing_date,
                status: ipo.status || 'open',

                // Calculated defaults for lot limits
                retail_min_lots: 1,
                retail_max_lots: ipo.category === 'Mainboard' ? 13 : 10,
                shni_min_lots: 2,
                shni_max_lots: ipo.category === 'Mainboard' ? 14 : 20,
                bhni_min_lots: ipo.category === 'Mainboard' ? 10 : 5,

                // Shareholder quota fields (defaults)
                has_shareholder_quota: false,
                shares_offered_shareholder: 0,
                applications_count_shareholder: latestSub?.applications_count_shareholder || 0
            };
        });
    } catch (error) {
        console.error('Error in fetchOpenIPOs:', error);
        return [];
    }
}

/**
 * Fetch single IPO details
 */
export async function fetchIPODetails(slug: string): Promise<IPO | null> {
    try {
        const { data, error } = await supabase
            .from('ipos')
            .select(`
                *,
                ipo_gmp(*),
                ipo_subscriptions(*)
            `)
            .eq('slug', slug)
            .single();

        if (error || !data) return null;

        // Extract latest GMP and subscription from nested arrays
        const latestGmp = getLatestGmp(data.ipo_gmp);
        const latestSub = getLatestSubscription(data.ipo_subscriptions);

        return {
            slug: data.slug || '',
            ipo_name: data.ipo_name || '',
            company_name: data.company_name || data.ipo_name || '',
            category: data.category || 'Mainboard',
            min_price: data.min_price || 0,
            max_price: data.max_price || 0,
            lot_size: data.lot_size || 1,
            issue_size_cr: data.issue_size_cr || 0,

            subscription_retail: latestSub?.subscription_retail || 0,
            subscription_nii: latestSub?.subscription_nii || 0,
            subscription_bnii: latestSub?.subscription_bhni || 0,
            subscription_qib: latestSub?.subscription_qib || 0,
            subscription_total: latestSub?.subscription_total || 0,
            subscription_shni: latestSub?.subscription_shni || 0,
            subscription_bhni: latestSub?.subscription_bhni || 0,

            gmp_amount: latestGmp?.gmp_amount || 0,
            gmp_percentage: latestGmp?.gmp_percentage || 0,
            expected_listing_price: latestGmp?.estimated_listing_price || (data.max_price + (latestGmp?.gmp_amount || 0)),

            open_date: data.open_date || '',
            close_date: data.close_date || '',
            listing_date: data.listing_date,
            status: data.status || 'open',

            retail_min_lots: 1,
            retail_max_lots: data.category === 'Mainboard' ? 13 : 10,
            shni_min_lots: 2,
            shni_max_lots: data.category === 'Mainboard' ? 14 : 20,
            bhni_min_lots: data.category === 'Mainboard' ? 10 : 5,

            has_shareholder_quota: false,
            shares_offered_shareholder: 0,
            applications_count_shareholder: latestSub?.applications_count_shareholder || 0
        };
    } catch (error) {
        console.error('Error fetching IPO details:', error);
        return null;
    }
}

/**
 * Subscribe to real-time subscription updates
 */
export function subscribeToIPOUpdates(
    callback: (payload: any) => void
) {
    return supabase
        .channel('ipo-updates')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'ipos',
                filter: 'status=eq.open'
            },
            callback
        )
        .subscribe();
}
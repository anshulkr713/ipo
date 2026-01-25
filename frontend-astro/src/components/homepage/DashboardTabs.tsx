'use client';

import { useState, useEffect } from 'react';
import styles from './DashboardTabs.module.css';
import { supabase, type IPOGmp, type IPOSubscription } from '../../lib/supabase';

// Helper functions to extract latest data from nested arrays
const getLatestGmp = (gmpRecords?: IPOGmp[]): IPOGmp | null => {
    if (!gmpRecords || gmpRecords.length === 0) return null;
    return gmpRecords.find(g => g.is_latest) || gmpRecords[0];
};

const getLatestSubscription = (subRecords?: IPOSubscription[]): IPOSubscription | null => {
    if (!subRecords || subRecords.length === 0) return null;
    return subRecords.find(s => s.is_latest) || subRecords[0];
};

// Inline fetch functions with joined queries
async function fetchOpenIPOs() {
    const { data } = await supabase
        .from('ipos')
        .select(`*, ipo_gmp(*), ipo_subscriptions(*)`)
        .eq('status', 'open')
        .order('close_date', { ascending: true });
    return data || [];
}

async function fetchClosingSoonIPOs() {
    const { data } = await supabase
        .from('ipos')
        .select(`*, ipo_gmp(*), ipo_subscriptions(*)`)
        .eq('status', 'closed')
        .order('close_date', { ascending: false });
    return data || [];
}

async function fetchRecentlyListedIPOs() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data } = await supabase
        .from('ipos')
        .select(`*, ipo_gmp(*), ipo_subscriptions(*)`)
        .eq('status', 'listed')
        .gte('listing_date', thirtyDaysAgo)
        .order('listing_date', { ascending: false })
        .limit(10);
    return data || [];
}

async function fetchUpcomingThisWeek() {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data } = await supabase
        .from('ipos')
        .select(`*, ipo_gmp(*), ipo_subscriptions(*)`)
        .eq('status', 'upcoming')
        .gte('open_date', today)
        .lte('open_date', nextWeek)
        .order('open_date', { ascending: true });
    return data || [];
}

type TabType = 'open' | 'closing' | 'listed' | 'upcoming';

export default function DashboardTabs() {
    const [activeTab, setActiveTab] = useState<TabType>('open');
    const [data, setData] = useState<any>({
        open: [],
        closing: [],
        listed: [],
        upcoming: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllData();
        const interval = setInterval(loadAllData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    async function loadAllData() {
        const [open, closing, listed, upcoming] = await Promise.all([
            fetchOpenIPOs(),
            fetchClosingSoonIPOs(),
            fetchRecentlyListedIPOs(),
            fetchUpcomingThisWeek()
        ]);

        setData({ open, closing, listed, upcoming });
        setLoading(false);
    }

    const tabs = [
        { id: 'open' as TabType, label: 'Currently Open', count: data.open.length, icon: '🟢' },
        { id: 'listed' as TabType, label: 'Recently Listed', count: data.listed.length, icon: '📈' },
        { id: 'upcoming' as TabType, label: 'Upcoming This Week', count: data.upcoming.length, icon: '📅' },
        { id: 'closing' as TabType, label: 'Closed', count: data.closing.length, icon: '🔴' }
    ];

    const renderIPOCard = (ipo: any, type: TabType) => {
        // Extract data from nested arrays
        const latestGmp = getLatestGmp(ipo.ipo_gmp);
        const latestSub = getLatestSubscription(ipo.ipo_subscriptions);
        const gmpAmount = latestGmp?.gmp_amount || 0;
        const gmpPercentage = latestGmp?.gmp_percentage || 0;
        const subscriptionTotal = latestSub?.subscription_total || 0;

        const daysLeft = type === 'open' || type === 'closing'
            ? Math.ceil((new Date(ipo.close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

        const listingGain = type === 'listed' && ipo.listing_gain_percent
            ? ipo.listing_gain_percent
            : null;

        return (
            <a href={`/ipo/${ipo.slug}`} key={ipo.id} className={styles.ipoCard}>
                <div className={styles.cardTop}>
                    <div className={styles.cardInfo}>
                        <h4 className={styles.ipoName}>{ipo.company_name || ipo.ipo_name}</h4>
                        <span className={`${styles.category} ${ipo.category === 'SME' ? styles.sme : styles.mainboard}`}>
                            {ipo.category}
                        </span>
                    </div>

                    {type === 'open' || type === 'closing' ? (
                        <div className={styles.cardMetrics}>
                            <div className={styles.metric}>
                                <span className={styles.metricLabel}>Subscription</span>
                                <span className={`${styles.metricValue} ${subscriptionTotal >= 1 ? styles.subscribed : ''}`}>
                                    {subscriptionTotal.toFixed(2)}x
                                </span>
                            </div>
                            {daysLeft !== null && (
                                <div className={styles.daysLeft}>
                                    {daysLeft > 0 ? `${daysLeft}d left` : 'Closes Today'}
                                </div>
                            )}
                        </div>
                    ) : type === 'listed' ? (
                        <div className={styles.listingGain}>
                            <span className={styles.gainLabel}>Listing Gain</span>
                            <span className={`${styles.gainValue} ${listingGain && listingGain > 0 ? styles.positive : styles.negative}`}>
                                {listingGain !== null ? `${listingGain > 0 ? '+' : ''}${listingGain.toFixed(1)}%` : 'N/A'}
                            </span>
                        </div>
                    ) : (
                        <div className={styles.upcomingDate}>
                            Opens: {new Date(ipo.open_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>

                <div className={styles.cardBottom}>
                    <div className={styles.gmpInfo}>
                        <span className={styles.gmpLabel}>GMP</span>
                        <span className={`${styles.gmpValue} ${gmpAmount >= 0 ? styles.positive : styles.negative}`}>
                            ₹{gmpAmount} ({gmpPercentage >= 0 ? '+' : ''}{gmpPercentage.toFixed(1)}%)
                        </span>
                    </div>
                    <div className={styles.cardArrow}>→</div>
                </div>
            </a>
        );
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading dashboard...</div>
            </div>
        );
    }

    const activeData = data[activeTab];

    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className={styles.tabIcon}>{tab.icon}</span>
                        <span className={styles.tabLabel}>{tab.label}</span>
                        <span className={styles.tabCount}>{tab.count}</span>
                    </button>
                ))}
            </div>

            <div className={styles.content}>
                {activeData.length > 0 ? (
                    <div className={styles.grid}>
                        {activeData.map((ipo: any) => renderIPOCard(ipo, activeTab))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <p>No IPOs in this category at the moment</p>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './DashboardTabs.module.css';
import {
    fetchOpenIPOs,
    fetchClosingSoonIPOs,
    fetchRecentlyListedIPOs,
    fetchUpcomingThisWeek
} from '@/lib/api';

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
        const daysLeft = type === 'open' || type === 'closing'
            ? Math.ceil((new Date(ipo.close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

        const listingGain = type === 'listed' && ipo.listing_gain_percent
            ? ipo.listing_gain_percent
            : null;

        return (
            <Link href={`/ipo/${ipo.slug}`} key={ipo.id} className={styles.ipoCard}>
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
                                <span className={`${styles.metricValue} ${ipo.subscription_total >= 1 ? styles.subscribed : ''}`}>
                                    {ipo.subscription_total.toFixed(2)}x
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
                        <span className={`${styles.gmpValue} ${ipo.gmp_amount >= 0 ? styles.positive : styles.negative}`}>
                            ₹{ipo.gmp_amount} ({ipo.gmp_percentage >= 0 ? '+' : ''}{ipo.gmp_percentage.toFixed(1)}%)
                        </span>
                    </div>
                    <div className={styles.cardArrow}>→</div>
                </div>
            </Link>
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

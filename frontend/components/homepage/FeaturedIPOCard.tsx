'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './FeaturedIPOCard.module.css';
import type { IPOGmp, IPOSubscription } from '../../lib/supabase';

interface FeaturedIPOProps {
    id: number;
    ipo_name: string;
    company_name: string;
    slug: string;
    category: 'SME' | 'Mainboard';
    status: string;
    close_date: string;
    open_date: string;
    max_price: number;
    min_price?: number;
    // Nested data from joins
    ipo_gmp?: IPOGmp[];
    ipo_subscriptions?: IPOSubscription[];
}

export default function FeaturedIPOCard({ ipo }: { ipo: FeaturedIPOProps }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const targetDate = ipo.status === 'open'
                ? new Date(ipo.close_date)
                : new Date(ipo.open_date);
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                return ipo.status === 'open' ? 'Closed' : 'Opening Soon';
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) return `${days}d ${hours}h left`;
            if (hours > 0) return `${hours}h ${minutes}m left`;
            return `${minutes}m left`;
        };

        setTimeLeft(calculateTimeLeft());
        const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);

        return () => clearInterval(interval);
    }, [ipo.close_date, ipo.open_date, ipo.status]);

    // Extract latest GMP from nested array
    const latestGmp = ipo.ipo_gmp?.find(g => g.is_latest) || ipo.ipo_gmp?.[0];
    const gmpAmount = latestGmp?.gmp_amount || 0;
    const gmpPercentage = latestGmp?.gmp_percentage || 0;
    const price = latestGmp?.issue_price || ipo.max_price || ipo.min_price || 0;

    // Extract latest subscription from nested array
    const latestSub = ipo.ipo_subscriptions?.find(s => s.is_latest) || ipo.ipo_subscriptions?.[0];
    const subscriptionTotal = latestSub?.subscription_total || 0;
    const subscriptionRetail = latestSub?.subscription_retail || 0;

    return (
        <Link href={`/ipo/${ipo.slug}`} className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.titleSection}>
                    <h3 className={styles.companyName}>{ipo.company_name || ipo.ipo_name}</h3>
                    <span className={`${styles.badge} ${ipo.category === 'SME' ? styles.smeBadge : styles.mainboardBadge}`}>
                        {ipo.category}
                    </span>
                </div>
                <div className={styles.statusSection}>
                    <span className={`${styles.statusBadge} ${ipo.status === 'open' ? styles.openStatus : styles.upcomingStatus}`}>
                        {ipo.status === 'open' ? '🔴 LIVE' : '🟡 Upcoming'}
                    </span>
                </div>
            </div>

            <div className={styles.metricsRow}>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>GMP</span>
                    <span className={`${styles.metricValue} ${gmpAmount >= 0 ? styles.positive : styles.negative}`}>
                        ₹{gmpAmount}
                    </span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>Expected Gain</span>
                    <span className={`${styles.metricValue} ${gmpPercentage >= 0 ? styles.positive : styles.negative}`}>
                        {gmpPercentage >= 0 ? '+' : ''}{gmpPercentage.toFixed(1)}%
                    </span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>Subscription</span>
                    <span className={styles.metricValue}>
                        {subscriptionTotal.toFixed(2)}x
                    </span>
                </div>
            </div>

            <div className={styles.progressSection}>
                <div className={styles.progressLabel}>
                    <span>Retail: {subscriptionRetail.toFixed(2)}x</span>
                    <span className={styles.timer}>{timeLeft}</span>
                </div>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{
                            width: `${Math.min(100, (subscriptionRetail / 5) * 100)}%`,
                            backgroundColor: subscriptionRetail >= 1 ? '#22c55e' : '#06b6d4'
                        }}
                    />
                </div>
            </div>

            <div className={styles.footer}>
                <span className={styles.price}>Issue Price: ₹{price}</span>
                <span className={styles.viewDetails}>View Details →</span>
            </div>
        </Link>
    );
}

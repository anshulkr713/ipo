'use client';

import Link from 'next/link';
import styles from './SubscriptionHeatmap.module.css';

export default function SubscriptionHeatmap({ ipos }: { ipos: any[] }) {
    const getHeatColor = (subscription: number) => {
        if (subscription < 1) return '#ef4444'; // Red - Undersubscribed
        if (subscription < 3) return '#f59e0b'; // Orange
        if (subscription < 5) return '#eab308'; // Yellow
        return '#22c55e'; // Green - Highly subscribed
    };

    const getHeatLabel = (subscription: number) => {
        if (subscription < 1) return 'Under';
        if (subscription < 3) return 'Low';
        if (subscription < 5) return 'Medium';
        if (subscription < 10) return 'High';
        return 'Very High';
    };

    if (ipos.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>
                    <p>No open IPOs to display in heatmap</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ backgroundColor: '#ef4444' }} />
                    <span>{'< 1x'}</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ backgroundColor: '#f59e0b' }} />
                    <span>1-3x</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ backgroundColor: '#eab308' }} />
                    <span>3-5x</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ backgroundColor: '#22c55e' }} />
                    <span>{'5x+'}</span>
                </div>
            </div>

            <div className={styles.grid}>
                {ipos.map(ipo => (
                    <Link
                        key={ipo.id}
                        href={`/ipo/${ipo.slug}`}
                        className={styles.heatBox}
                        style={{
                            backgroundColor: getHeatColor(ipo.subscription_total),
                            '--box-color': getHeatColor(ipo.subscription_total)
                        } as React.CSSProperties}
                        title={`${ipo.company_name}: ${ipo.subscription_total.toFixed(2)}x subscribed`}
                    >
                        <div className={styles.boxContent}>
                            <span className={styles.companyName}>{ipo.company_name || ipo.ipo_name}</span>
                            <span className={styles.subscription}>{ipo.subscription_total.toFixed(2)}x</span>
                            <span className={styles.label}>{getHeatLabel(ipo.subscription_total)}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

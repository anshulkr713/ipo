'use client';

import { useEffect, useState } from 'react';
import IPOCard from '@/components/IPOCard';
import styles from './page.module.css';
import { fetchCombinedIPOData } from '@/lib/api';

export default function UpcomingIPOs() {
    const [upcomingIPOs, setUpcomingIPOs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchCombinedIPOData();
                setUpcomingIPOs(data);
            } catch (error) {
                console.error('Failed to load upcoming IPOs:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Upcoming IPOs</h1>
                <p className={styles.sectionSubtitle}>Loading IPO data...</p>
            </div>
        );
    }

    return (
        <>
            <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Upcoming IPOs</h1>
                <p className={styles.sectionSubtitle}>
                    Live tracking of all scheduled IPO launches with detailed information
                </p>
            </div>

            <div className={styles.ipoGrid}>
                {upcomingIPOs.map((ipo) => (
                    <IPOCard key={ipo.id} ipo={ipo} />
                ))}
            </div>

            {upcomingIPOs.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No upcoming IPOs at the moment. Check back soon!</p>
                </div>
            )}
        </>
    );
}
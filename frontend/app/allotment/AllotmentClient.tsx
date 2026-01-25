'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { fetchAllotmentLinks } from '@/lib/api';

interface AllotmentData {
    id: number;
    ipo_name: string;
    registrar: string;
    link_url: string;
    allotment_date: string | null;
    status: string | null;
    category: string | null;
}

export default function AllotmentClient() {
    const [allotmentData, setAllotmentData] = useState<AllotmentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchAllotmentLinks();
                setAllotmentData(data);
            } catch (error) {
                console.error('Failed to load allotment data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'TBD';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.sectionHeader}>
                    <h1 className={styles.sectionTitle}>Check IPO Allotment</h1>
                    <p className={styles.sectionSubtitle}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Check IPO Allotment</h1>
                <p className={styles.sectionSubtitle}>
                    Check your IPO allotment status directly from registrar websites
                </p>
            </div>

            <div className={styles.allotmentGrid}>
                {allotmentData.map((ipo) => (
                    <div key={ipo.id} className={styles.allotmentCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.titleRow}>
                                <h3 className={styles.companyName}>{ipo.ipo_name}</h3>
                                {ipo.category && (
                                    <span className={`${styles.categoryBadge} ${ipo.category === 'SME' ? styles.smeBadge : styles.mainboardBadge}`}>
                                        {ipo.category}
                                    </span>
                                )}
                            </div>
                            {ipo.status && (
                                <span className={`${styles.statusBadge} ${ipo.status === 'Allotment Out' ? styles.statusOut : styles.statusPending}`}>
                                    {ipo.status}
                                </span>
                            )}
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Registrar:</span>
                                <span className={styles.value}>{ipo.registrar}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Allotment Date:</span>
                                <span className={styles.value}>{formatDate(ipo.allotment_date)}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Allotment Status:</span>
                                <span className={styles.value}>{ipo.status || 'Pending'}</span>
                            </div>
                        </div>

                        {ipo.status === 'Allotment Out' ? (
                            <a
                                href={ipo.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.checkButton}
                            >
                                Check Allotment Status
                                <span className={styles.externalIcon}>↗</span>
                            </a>
                        ) : (
                            <div className={styles.checkButtonDisabled}>
                                Check Allotment Status
                                <span className={styles.externalIcon}>↗</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {allotmentData.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No allotment links available at the moment.</p>
                </div>
            )}
        </div>
    );
}
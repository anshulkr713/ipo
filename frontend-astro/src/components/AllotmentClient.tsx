'use client';

import { useEffect, useState } from 'react';
import styles from '../styles/allotment.module.css';
import { fetchAllotmentLinks } from '../lib/api';

interface AllotmentData {
    id: number;
    ipo_id: number;
    category: string;
    registrar_link: string | null;
    link_type: string | null;
    is_active: boolean;
    allotment_percentage?: number;
    allotment_ratio?: string;
    // Nested IPO data from join
    ipos?: {
        ipo_name: string;
        company_name: string;
        slug: string;
        category: string;
        status: string;
        allotment_date?: string;
        registrar?: string;
    };
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

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'TBD';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Determine status based on whether link is active and available
    const getAllotmentStatus = (item: AllotmentData) => {
        if (item.registrar_link && item.is_active) {
            return 'Allotment Out';
        }
        return 'Pending';
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
                {allotmentData.map((item) => {
                    const ipoData = item.ipos;
                    const ipoName = ipoData?.ipo_name || 'Unknown IPO';
                    const category = ipoData?.category || null;
                    const registrar = ipoData?.registrar || 'Unknown';
                    const allotmentDate = ipoData?.allotment_date;
                    const status = getAllotmentStatus(item);

                    return (
                        <div key={item.id} className={styles.allotmentCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.titleRow}>
                                    <h3 className={styles.companyName}>{ipoName}</h3>
                                    {category && (
                                        <span className={`${styles.categoryBadge} ${category === 'SME' ? styles.smeBadge : styles.mainboardBadge}`}>
                                            {category}
                                        </span>
                                    )}
                                </div>
                                <span className={`${styles.statusBadge} ${status === 'Allotment Out' ? styles.statusOut : styles.statusPending}`}>
                                    {status}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Registrar:</span>
                                    <span className={styles.value}>{registrar}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Allotment Date:</span>
                                    <span className={styles.value}>{formatDate(allotmentDate)}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Category:</span>
                                    <span className={styles.value}>{item.category}</span>
                                </div>
                                {item.allotment_ratio && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Ratio:</span>
                                        <span className={styles.value}>{item.allotment_ratio}</span>
                                    </div>
                                )}
                            </div>

                            {status === 'Allotment Out' && item.registrar_link ? (
                                <a
                                    href={item.registrar_link}
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
                    );
                })}
            </div>

            {allotmentData.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No allotment links available at the moment.</p>
                </div>
            )}
        </div>
    );
}

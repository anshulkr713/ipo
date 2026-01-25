'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import GMPModal from './GMPModal';
import { fetchGMPData } from '@/lib/api';

interface DayWiseData {
    date: string;
    day: number;
    qibExAnchor?: number;
    nii?: number;
    bNII?: number;
    sNII?: number;
    retail: number;
    total: number;
}

interface SubscriptionData {
    anchorInvestors?: number;
    qibExAnchor?: number;
    nonInstitutional?: number;
    bNII?: number;
    sNII?: number;
    retail?: number;
    employee?: number;
    shareholder?: number;
    total?: number;
    dayWise?: DayWiseData[];
}

interface GMPData {
    id: number;
    ipo_name: string;
    company_name: string;
    category: string;
    gmp: number;
    percentage: number;
    issue_price: string;
    price: number;
    expected_listing: string;
    lot_size: string;
    listing_date: string;
    status: string;
    anchor_investors?: number;
    qib_ex_anchor?: number;
    non_institutional?: number;
    b_nii?: number;
    s_nii?: number;
    retail?: number;
    employee?: number;
    shareholder?: number;
    total_subscription?: number;
    day_wise_subscription?: DayWiseData[];
}

// Helper function to get status badge class
const getStatusClass = (status: string) => {
    switch (status) {
        case 'Issue Open': return styles.statusOpen;
        case 'Opening Soon': return styles.statusOpeningSoon;
        case 'Closed': return styles.statusClosed;
        default: return '';
    }
};

// Helper function to format date for display
const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function GMPClient() {
    const [gmpData, setGmpData] = useState<GMPData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIPO, setSelectedIPO] = useState<GMPData | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchGMPData();
                // Transform database fields to UI-expected fields
                const transformedData = data.map((ipo: any) => ({
                    id: ipo.id,
                    ipo_name: ipo.ipo_name,
                    company_name: ipo.company_name || ipo.ipo_name,
                    category: ipo.category || 'Mainboard',
                    gmp: ipo.gmp_amount || 0,
                    percentage: ipo.gmp_percentage || 0,
                    issue_price: ipo.max_price ? `₹${ipo.max_price}` : (ipo.price_range || '-'),
                    price: ipo.max_price || 0,
                    expected_listing: ipo.max_price && ipo.gmp_amount ? `₹${ipo.max_price + ipo.gmp_amount}` : '-',
                    lot_size: ipo.lot_size ? `${ipo.lot_size} shares` : '-',
                    listing_date: ipo.listing_date || '',
                    status: ipo.status === 'open' ? 'Issue Open' :
                        ipo.status === 'upcoming' ? 'Opening Soon' : 'Closed',
                    anchor_investors: ipo.anchor_investors,
                    qib_ex_anchor: ipo.subscription_qib,
                    non_institutional: ipo.subscription_nii,
                    b_nii: ipo.subscription_bnii,
                    s_nii: ipo.subscription_snii,
                    retail: ipo.subscription_retail,
                    employee: ipo.subscription_employee,
                    shareholder: ipo.subscription_shareholder,
                    total_subscription: ipo.subscription_total,
                    day_wise_subscription: ipo.day_wise_subscription
                }));
                setGmpData(transformedData);
            } catch (error) {
                console.error('Failed to load GMP data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Sort IPOs by listing date (ascending - nearest first)
    const sortedData = [...gmpData].sort((a, b) =>
        new Date(a.listing_date).getTime() - new Date(b.listing_date).getTime()
    );

    // Group IPOs by category
    const mainboardIPOs = sortedData.filter(ipo => ipo.category === "Mainboard");
    const smeIPOs = sortedData.filter(ipo => ipo.category === "SME");

    const renderIPOCards = (ipos: GMPData[]) => (
        ipos.map((ipo) => (
            <div
                key={ipo.id}
                className={styles.gmpCard}
            >
                <div
                    className={styles.gmpHeader}
                    onClick={() => setSelectedIPO(ipo)}
                >
                    <div className={styles.headerTop}>
                        <h3 className={styles.gmpCompany}>{ipo.company_name || ipo.ipo_name}</h3>
                        <div className={styles.badgeStack}>
                            <span className={`${styles.categoryBadge} ${ipo.category === 'SME' ? styles.smeBadge : styles.mainboardBadge}`}>
                                {ipo.category}
                            </span>
                            <span className={`${styles.statusBadge} ${getStatusClass(ipo.status)}`}>
                                {ipo.status}
                            </span>
                        </div>
                    </div>
                    <div className={`${styles.gmpValue} ${ipo.gmp < 0 ? styles.negative : ''}`}>
                        ₹{ipo.gmp}
                    </div>
                    <p className={`${styles.gmpPercentage} ${ipo.percentage < 0 ? styles.lossText : styles.profitText}`}>
                        {ipo.percentage >= 0 ? '+' : ''}{ipo.percentage}% {ipo.percentage >= 0 ? 'Profit' : 'Loss'}
                    </p>
                </div>

                <div className={styles.gmpInfo}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Issue Price</span>
                        <span className={styles.infoValue}>{ipo.issue_price}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Expected</span>
                        <span className={styles.infoValue}>{ipo.expected_listing}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Lot Size</span>
                        <span className={styles.infoValue}>{ipo.lot_size}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Listing</span>
                        <span className={styles.infoValue}>{formatDisplayDate(ipo.listing_date)}</span>
                    </div>
                </div>
            </div>
        ))
    );

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.sectionHeader}>
                    <h1 className={styles.sectionTitle}>Grey Market Premium</h1>
                    <p className={styles.sectionSubtitle}>Loading GMP data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Grey Market Premium</h1>
                <p className={styles.sectionSubtitle}>
                    Real-time GMP tracking and listing price predictions
                </p>
            </div>

            {/* Mainboard IPOs Section */}
            {mainboardIPOs.length > 0 && (
                <div className={styles.categorySection}>
                    <h2 className={styles.categoryTitle}>
                        <span className={styles.categoryIcon}>📊</span>
                        Mainboard IPOs
                        <span className={styles.categoryCount}>({mainboardIPOs.length})</span>
                    </h2>
                    <div className={styles.gmpGrid}>
                        {renderIPOCards(mainboardIPOs)}
                    </div>
                </div>
            )}

            {/* SME IPOs Section */}
            {smeIPOs.length > 0 && (
                <div className={styles.categorySection}>
                    <h2 className={styles.categoryTitle}>
                        <span className={styles.categoryIcon}>🚀</span>
                        SME IPOs
                        <span className={styles.categoryCount}>({smeIPOs.length})</span>
                    </h2>
                    <div className={styles.gmpGrid}>
                        {renderIPOCards(smeIPOs)}
                    </div>
                </div>
            )}

            {gmpData.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No GMP data available at the moment.</p>
                </div>
            )}

            {/* Modal */}
            {selectedIPO && (
                <GMPModal
                    ipo={{
                        ...selectedIPO,
                        companyName: selectedIPO.company_name || selectedIPO.ipo_name,
                        issuePrice: selectedIPO.issue_price,
                        expectedListing: selectedIPO.expected_listing,
                        lotSize: selectedIPO.lot_size,
                        listingDate: selectedIPO.listing_date,
                        subscription: {
                            anchorInvestors: selectedIPO.anchor_investors,
                            qibExAnchor: selectedIPO.qib_ex_anchor,
                            nonInstitutional: selectedIPO.non_institutional,
                            bNII: selectedIPO.b_nii,
                            sNII: selectedIPO.s_nii,
                            retail: selectedIPO.retail,
                            employee: selectedIPO.employee,
                            shareholder: selectedIPO.shareholder,
                            total: selectedIPO.total_subscription,
                            dayWise: selectedIPO.day_wise_subscription
                        }
                    }}
                    onClose={() => setSelectedIPO(null)}
                />
            )}
        </div>
    );
}
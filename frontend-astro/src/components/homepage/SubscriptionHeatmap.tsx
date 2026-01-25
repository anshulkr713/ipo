'use client';

import { useState, useEffect, useMemo } from 'react';

import styles from './SubscriptionHeatmap.module.css';
import { fetchCombinedIPOData, getLatestGmp, getLatestSubscription } from '../../lib/api';

type MetricType = 'ipoSize' | 'gmpPercent' | 'retailSub' | 'shniSub' | 'bhniSub' | 'employeeSub' | 'totalSub' | 'listingGain' | 'priceBand';
type CategoryType = 'all' | 'SME' | 'Mainboard';
type StatusType = 'all' | 'open' | 'closed' | 'upcoming' | 'listed';
type DateRangeType = '7d' | '30d' | '3m' | '6m' | '1y' | 'all' | 'custom';

interface IPOData {
    id: number;
    slug: string;
    ipo_name: string;
    company_name?: string;
    category?: string;
    issue_size_cr?: number;
    price_band_low?: number;
    price_band_high?: number;
    gmp_percentage?: number;
    gmp_amount?: number;
    subscription_retail?: number;
    subscription_nii?: number;
    subscription_qib?: number;
    subscription_total?: number;
    subscription_employee?: number;
    listing_gain_percent?: number;
    open_date?: string;
    close_date?: string;
    listing_date?: string;
    status?: string;
}

const metricOptions = [
    { value: 'ipoSize', label: 'IPO Size (₹ Cr)' },
    { value: 'gmpPercent', label: 'GMP Percentage' },
    { value: 'retailSub', label: 'Retail Subscription' },
    { value: 'shniSub', label: 'sHNI Subscription' },
    { value: 'bhniSub', label: 'bHNI Subscription' },
    { value: 'employeeSub', label: 'Employee Subscription' },
    { value: 'totalSub', label: 'Total Subscription' },
    { value: 'listingGain', label: 'Listing Gain %' },
    { value: 'priceBand', label: 'Price Band (₹)' },
];

const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'SME', label: 'SME' },
    { value: 'Mainboard', label: 'Mainboard' },
];

const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'listed', label: 'Recently Listed' },
];

const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '1y', label: 'Last 1 Year' },
    { value: 'custom', label: 'Custom Range' },
];

// Dynamic legend labels based on metric
const getLegendLabels = (metric: MetricType) => {
    switch (metric) {
        case 'gmpPercent':
        case 'listingGain':
            return ['< 0%', '0-10%', '10-30%', '30%+'];
        case 'retailSub':
        case 'shniSub':
        case 'bhniSub':
        case 'employeeSub':
        case 'totalSub':
            return ['< 1x', '1-3x', '3-5x', '5x+'];
        case 'ipoSize':
            return ['< ₹50Cr', '₹50-200Cr', '₹200-500Cr', '₹500Cr+'];
        case 'priceBand':
            return ['< ₹100', '₹100-300', '₹300-500', '₹500+'];
        default:
            return ['Low', 'Below Avg', 'Average', 'High'];
    }
};

export default function SubscriptionHeatmap() {
    const [ipos, setIpos] = useState<IPOData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('totalSub');
    const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
    const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
    const [selectedDateRange, setSelectedDateRange] = useState<DateRangeType>('all');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    useEffect(() => {
        loadData();
        // Set default custom dates
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        setCustomEndDate(today.toISOString().split('T')[0]);
        setCustomStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    }, []);

    async function loadData() {
        try {
            const data = await fetchCombinedIPOData();
            // Transform data to extract GMP and subscription from nested arrays
            const transformedData = (data || []).map((ipo: any) => {
                const latestGmp = getLatestGmp(ipo.ipo_gmp);
                const latestSub = getLatestSubscription(ipo.ipo_subscriptions);

                return {
                    ...ipo,
                    gmp_amount: latestGmp?.gmp_amount || 0,
                    gmp_percentage: latestGmp?.gmp_percentage || 0,
                    subscription_retail: latestSub?.subscription_retail || 0,
                    subscription_nii: latestSub?.subscription_nii || 0,
                    subscription_qib: latestSub?.subscription_qib || 0,
                    subscription_total: latestSub?.subscription_total || 0,
                    subscription_employee: latestSub?.subscription_employee || 0,
                    price_band_low: ipo.min_price,
                    price_band_high: ipo.max_price,
                };
            });
            setIpos(transformedData);
        } catch (error) {
            console.error('Error loading IPO data:', error);
        } finally {
            setLoading(false);
        }
    }

    // Get metric value for an IPO
    const getMetricValue = (ipo: IPOData): number => {
        switch (selectedMetric) {
            case 'ipoSize': return ipo.issue_size_cr || 0;
            case 'gmpPercent': return ipo.gmp_percentage || 0;
            case 'retailSub': return ipo.subscription_retail || 0;
            case 'shniSub': return (ipo.subscription_nii || 0) * 0.5;
            case 'bhniSub': return (ipo.subscription_nii || 0) * 0.5;
            case 'employeeSub': return ipo.subscription_employee || 0;
            case 'totalSub': return ipo.subscription_total || 0;
            case 'listingGain': return ipo.listing_gain_percent || 0;
            case 'priceBand': return ((ipo.price_band_low || 0) + (ipo.price_band_high || 0)) / 2;
            default: return 0;
        }
    };

    // Get display string for metric
    const getMetricDisplay = (ipo: IPOData): string => {
        const value = getMetricValue(ipo);
        switch (selectedMetric) {
            case 'ipoSize': return `₹${value.toFixed(0)}Cr`;
            case 'gmpPercent': return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
            case 'retailSub':
            case 'shniSub':
            case 'bhniSub':
            case 'employeeSub':
            case 'totalSub': return `${value.toFixed(2)}x`;
            case 'listingGain': return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
            case 'priceBand': return `₹${value.toFixed(0)}`;
            default: return value.toString();
        }
    };

    // Get IPO status
    const getIPOStatus = (ipo: IPOData): StatusType => {
        const now = new Date();
        const openDate = ipo.open_date ? new Date(ipo.open_date) : null;
        const closeDate = ipo.close_date ? new Date(ipo.close_date) : null;
        const listingDate = ipo.listing_date ? new Date(ipo.listing_date) : null;

        if (listingDate && listingDate <= now) return 'listed';
        if (closeDate && closeDate < now) return 'closed';
        if (openDate && closeDate && openDate <= now && closeDate >= now) return 'open';
        if (openDate && openDate > now) return 'upcoming';
        return 'all';
    };

    // Filter IPOs
    const filteredIpos = useMemo(() => {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date = now;

        if (selectedDateRange === 'all') {
            // Skip date filtering
        } else if (selectedDateRange === 'custom' && customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
        } else {
            let daysBack = 30;
            if (selectedDateRange === '7d') daysBack = 7;
            else if (selectedDateRange === '3m') daysBack = 90;
            else if (selectedDateRange === '6m') daysBack = 180;
            else if (selectedDateRange === '1y') daysBack = 365;
            startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        }

        const result = ipos.filter(ipo => {
            // Date filter - skip if 'all' selected or no date available
            if (startDate !== null) {
                const relevantDate = ipo.listing_date || ipo.close_date || ipo.open_date;
                if (relevantDate) {
                    const ipoDate = new Date(relevantDate);
                    const inRange = ipoDate >= startDate && ipoDate <= endDate;
                    if (!inRange) return false;
                }
            }

            // Category filter
            if (selectedCategory !== 'all' && ipo.category !== selectedCategory) return false;

            // Status filter
            if (selectedStatus !== 'all' && getIPOStatus(ipo) !== selectedStatus) return false;

            return true;
        });

        return result;
    }, [ipos, selectedDateRange, customStartDate, customEndDate, selectedCategory, selectedStatus]);

    // Calculate box sizes (treemap-style)
    const boxData = useMemo(() => {
        if (filteredIpos.length === 0) return [];

        const values = filteredIpos.map(ipo => ({
            ipo,
            value: Math.abs(getMetricValue(ipo)),
            displayValue: getMetricDisplay(ipo),
        }));

        values.sort((a, b) => b.value - a.value);
        const maxValue = Math.max(...values.map(v => v.value), 1);

        return values.map(item => ({
            ...item,
            size: Math.max(1, Math.ceil((item.value / maxValue) * 5)),
        }));
    }, [filteredIpos, selectedMetric]);

    // Get color based on metric value
    const getBoxColor = (ipo: IPOData): string => {
        const value = getMetricValue(ipo);

        if (selectedMetric === 'gmpPercent' || selectedMetric === 'listingGain') {
            if (value < 0) return '#ef4444';
            if (value < 10) return '#f59e0b';
            if (value < 30) return '#eab308';
            return '#22c55e';
        }

        if (selectedMetric.includes('Sub')) {
            if (value < 1) return '#ef4444';
            if (value < 3) return '#f59e0b';
            if (value < 5) return '#eab308';
            return '#22c55e';
        }

        if (selectedMetric === 'ipoSize') {
            if (value < 50) return '#ef4444';
            if (value < 200) return '#f59e0b';
            if (value < 500) return '#eab308';
            return '#22c55e';
        }

        if (selectedMetric === 'priceBand') {
            if (value < 100) return '#ef4444';
            if (value < 300) return '#f59e0b';
            if (value < 500) return '#eab308';
            return '#22c55e';
        }

        const normalized = Math.min(value / 500, 1);
        const hue = 200 + normalized * 60;
        return `hsl(${hue}, 70%, 45%)`;
    };

    const legendLabels = getLegendLabels(selectedMetric);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading heatmap data...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Filter Controls */}
            <div className={styles.filterRow}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Date Range</label>
                    <select
                        value={selectedDateRange}
                        onChange={(e) => setSelectedDateRange(e.target.value as DateRangeType)}
                        className={styles.filterSelect}
                    >
                        {dateRangeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {selectedDateRange === 'custom' && (
                    <>
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>From</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className={styles.filterSelect}
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>To</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className={styles.filterSelect}
                            />
                        </div>
                    </>
                )}

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as CategoryType)}
                        className={styles.filterSelect}
                    >
                        {categoryOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Status</label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as StatusType)}
                        className={styles.filterSelect}
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Metric</label>
                    <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                        className={styles.filterSelect}
                    >
                        {metricOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Dynamic Legend */}
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ backgroundColor: '#ef4444' }} />
                    <span>{legendLabels[0]}</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ backgroundColor: '#f59e0b' }} />
                    <span>{legendLabels[1]}</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ backgroundColor: '#eab308' }} />
                    <span>{legendLabels[2]}</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ backgroundColor: '#22c55e' }} />
                    <span>{legendLabels[3]}</span>
                </div>
            </div>

            {/* Treemap Grid */}
            {boxData.length > 0 ? (
                <div className={styles.treemap}>
                    {boxData.map(({ ipo, displayValue, size }) => (
                        <a
                            key={ipo.id}
                            href={`/ipo/${ipo.slug}`}
                            className={`${styles.heatBox} ${styles[`size${size}`]}`}
                            style={{
                                backgroundColor: getBoxColor(ipo),
                            }}
                            title={`${ipo.company_name || ipo.ipo_name}: ${displayValue}`}
                        >
                            <div className={styles.boxContent}>
                                <span className={styles.companyName}>
                                    {ipo.company_name || ipo.ipo_name}
                                </span>
                                <span className={styles.metricValue}>{displayValue}</span>
                                <span className={styles.categoryBadge}>{ipo.category}</span>
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                <div className={styles.empty}>
                    <p>No IPOs match the selected filters</p>
                </div>
            )}
        </div>
    );
}

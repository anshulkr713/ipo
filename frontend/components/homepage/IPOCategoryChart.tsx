'use client';

import { useState, useEffect } from 'react';
import styles from './IPOCategoryChart.module.css';
import { fetchFeaturedIPOs, fetchOpenIPOs } from '@/lib/api';

interface IPOData {
    id: number;
    ipo_name: string;
    company_name?: string;
    category?: string;
    issue_size_cr?: number;
    lot_size?: number;
    subscription_retail?: number;
    subscription_nii?: number;
    subscription_qib?: number;
    subscription_total?: number;
}

type FilterType = 'allocation' | 'issueSize' | 'subscription';

interface FilterOption {
    value: FilterType;
    label: string;
}

const filterOptions: FilterOption[] = [
    { value: 'allocation', label: 'Allocation %' },
    { value: 'issueSize', label: 'Issue Size (₹ Cr)' },
    { value: 'subscription', label: 'Subscription Data' },
];

// Dynamic color palette supporting 1-12 metrics
// Colors are designed to be visually distinct and accessible
const CHART_COLORS = [
    '#FFED4E', // Yellow (Primary)
    '#FF9500', // Orange
    '#007AFF', // Blue
    '#AF52DE', // Purple
    '#5AC8FA', // Teal
    '#34C759', // Green
    '#FF3B30', // Red
    '#FF6F61', // Coral
    '#00C7BE', // Cyan
    '#FFD60A', // Gold
    '#BF5AF2', // Violet
    '#64D2FF', // Sky Blue
];

// Helper function to get color by index (cycles if more than 12 items)
function getChartColor(index: number): string {
    return CHART_COLORS[index % CHART_COLORS.length];
}

// SEBI-defined allocation percentages for Mainboard IPOs
const ALLOCATION_PERCENTAGES = {
    retail: 35,
    qib: 50,
    nii: 15,
};

// Interface for pie segment - designed to be dynamic
interface PieSegment {
    label: string;
    value: number;
    color: string;
    displayValue: string;
    subscribed?: string;
}

// Utility function to build chart segments from any array of metrics
// Supports 1-12 segments dynamically with automatic color assignment
interface MetricInput {
    label: string;
    value: number;
    displayValue: string;
    subscribed?: string;
}

function buildChartSegments(metrics: MetricInput[]): PieSegment[] {
    return metrics.map((metric, index) => ({
        ...metric,
        color: getChartColor(index),
    }));
}

export default function IPOCategoryChart() {
    const [ipos, setIpos] = useState<IPOData[]>([]);
    const [selectedIPO, setSelectedIPO] = useState<IPOData | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('allocation');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadIPOs();
    }, []);

    async function loadIPOs() {
        try {
            const [featured, open] = await Promise.all([
                fetchFeaturedIPOs(),
                fetchOpenIPOs(),
            ]);
            const allIPOs = [...featured, ...open];
            // Remove duplicates based on id
            const uniqueIPOs = allIPOs.filter((ipo, index, self) =>
                index === self.findIndex((t) => t.id === ipo.id)
            );
            setIpos(uniqueIPOs);
            if (uniqueIPOs.length > 0) {
                setSelectedIPO(uniqueIPOs[0]);
            }
        } catch (error) {
            console.error('Error loading IPOs:', error);
        } finally {
            setLoading(false);
        }
    }

    const getChartData = (): PieSegment[] => {
        if (!selectedIPO) return [];

        const issueSize = selectedIPO.issue_size_cr || 100;
        const retailSub = selectedIPO.subscription_retail || 0;
        const niiSub = selectedIPO.subscription_nii || 0;
        const qibSub = selectedIPO.subscription_qib || 0;

        switch (selectedFilter) {
            case 'allocation':
                return [
                    { label: 'Retail Investors', value: ALLOCATION_PERCENTAGES.retail, color: getChartColor(0), displayValue: `${ALLOCATION_PERCENTAGES.retail}%`, subscribed: `${retailSub.toFixed(2)}x subscribed` },
                    { label: 'QIB (Qualified Institutional Buyers)', value: ALLOCATION_PERCENTAGES.qib, color: getChartColor(1), displayValue: `${ALLOCATION_PERCENTAGES.qib}%`, subscribed: `${qibSub.toFixed(2)}x subscribed` },
                    { label: 'NII (Non-Institutional Investors)', value: ALLOCATION_PERCENTAGES.nii, color: getChartColor(2), displayValue: `${ALLOCATION_PERCENTAGES.nii}%`, subscribed: `${niiSub.toFixed(2)}x subscribed` },
                ];

            case 'issueSize': {
                const retailCr = (issueSize * ALLOCATION_PERCENTAGES.retail) / 100;
                const qibCr = (issueSize * ALLOCATION_PERCENTAGES.qib) / 100;
                const niiCr = (issueSize * ALLOCATION_PERCENTAGES.nii) / 100;
                return [
                    { label: 'Retail Investors', value: retailCr, color: getChartColor(0), displayValue: `₹${retailCr.toFixed(1)} Cr` },
                    { label: 'QIB (Qualified Institutional Buyers)', value: qibCr, color: getChartColor(1), displayValue: `₹${qibCr.toFixed(1)} Cr` },
                    { label: 'NII (Non-Institutional Investors)', value: niiCr, color: getChartColor(2), displayValue: `₹${niiCr.toFixed(1)} Cr` },
                ];
            }

            case 'subscription': {
                return [
                    { label: 'Retail Investors', value: retailSub || 0.01, color: getChartColor(0), displayValue: `${retailSub.toFixed(2)}x` },
                    { label: 'QIB (Qualified Institutional Buyers)', value: qibSub || 0.01, color: getChartColor(1), displayValue: `${qibSub.toFixed(2)}x` },
                    { label: 'NII (Non-Institutional Investors)', value: niiSub || 0.01, color: getChartColor(2), displayValue: `${niiSub.toFixed(2)}x` },
                ];
            }

            default:
                return [];
        }
    };

    const chartData = getChartData();
    const total = chartData.reduce((sum, segment) => sum + segment.value, 0) || 1;

    // Generate solid pie chart using path elements
    const generatePieSlices = () => {
        let currentAngle = -90; // Start from top
        const centerX = 140;
        const centerY = 140;
        const radius = 120;

        return chartData.map((segment, index) => {
            const percentage = segment.value / total;
            const sliceAngle = percentage * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;

            currentAngle = endAngle;

            // Convert angles to radians
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            // Calculate arc points
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            // Large arc flag
            const largeArc = sliceAngle > 180 ? 1 : 0;

            const pathData = `
                M ${centerX} ${centerY}
                L ${x1} ${y1}
                A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                Z
            `;

            return (
                <path
                    key={index}
                    d={pathData}
                    fill={segment.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className={styles.pieSlice}
                />
            );
        });
    };

    const getCenterValue = (): string => {
        switch (selectedFilter) {
            case 'allocation':
                return '100%';
            case 'issueSize':
                return `₹${selectedIPO?.issue_size_cr || 0}Cr`;
            case 'subscription':
                return `${(selectedIPO?.subscription_total || 0).toFixed(2)}x`;
            default:
                return '100%';
        }
    };

    const getCenterLabel = (): string => {
        switch (selectedFilter) {
            case 'allocation':
                return 'Total Allocation';
            case 'issueSize':
                return 'Total Issue Size';
            case 'subscription':
                return 'Total Subscribed';
            default:
                return 'Total';
        }
    };

    if (loading) {
        return (
            <div className={styles.chartSection}>
                <div className={styles.loading}>Loading IPO data...</div>
            </div>
        );
    }

    return (
        <div className={styles.chartSection}>
            <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>IPO Category Distribution</h2>
                <p className={styles.chartSubtitle}>Breakdown by subscription category</p>
            </div>

            {/* Dropdowns */}
            <div className={styles.dropdownRow}>
                <div className={styles.dropdownGroup}>
                    <label className={styles.dropdownLabel}>Select IPO</label>
                    <select
                        value={selectedIPO?.id || ''}
                        onChange={(e) => {
                            const ipo = ipos.find(i => i.id === Number(e.target.value));
                            if (ipo) setSelectedIPO(ipo);
                        }}
                        className={styles.dropdown}
                    >
                        {ipos.map((ipo) => (
                            <option key={ipo.id} value={ipo.id}>
                                {ipo.ipo_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.dropdownGroup}>
                    <label className={styles.dropdownLabel}>Filter By</label>
                    <select
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
                        className={styles.dropdown}
                    >
                        {filterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.chartContainer}>
                {/* Pie Chart */}
                <div className={styles.pieChart}>
                    <svg width="280" height="280" viewBox="0 0 280 280">
                        <g style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                            {generatePieSlices()}
                        </g>
                    </svg>
                    <div className={styles.pieCenter}>
                        <div className={styles.pieCenterValue}>{getCenterValue()}</div>
                        <div className={styles.pieCenterLabel}>{getCenterLabel()}</div>
                    </div>
                </div>

                {/* Legend */}
                <div className={styles.chartLegend}>
                    {chartData.map((segment, index) => (
                        <div key={index} className={styles.legendItem}>
                            <div
                                className={styles.legendColor}
                                style={{ backgroundColor: segment.color }}
                            />
                            <div className={styles.legendInfo}>
                                <div className={styles.legendLabel}>{segment.label}</div>
                                <div className={styles.legendValue}>
                                    {segment.displayValue}
                                    {segment.subscribed && (
                                        <span className={styles.legendPercent}>{segment.subscribed}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

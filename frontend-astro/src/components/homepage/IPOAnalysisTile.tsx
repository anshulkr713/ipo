'use client';

import { useState } from 'react';
import styles from './IPOAnalysisTile.module.css';

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

type FilterType = 'allocation' | 'issueSize' | 'subscription' | 'lots' | 'investors';

interface FilterOption {
    value: FilterType;
    label: string;
}

const filterOptions: FilterOption[] = [
    { value: 'allocation', label: 'Allocation %' },
    { value: 'issueSize', label: 'Issue Size (₹ Cr)' },
    { value: 'subscription', label: 'Subscription Data' },
    { value: 'lots', label: 'Lot Distribution' },
    { value: 'investors', label: 'Investor Count' },
];

// SEBI-defined allocation percentages
const ALLOCATION_PERCENTAGES = {
    retail: 35,
    sNII: 15,
    bNII: 15,
    qib: 35,
};

// Black and Yellow/Gold theme colors
const THEME_COLORS = {
    retail: '#ffed4e',    // Bright Yellow
    sNII: '#d4af37',      // Gold
    bNII: '#b8860b',      // Dark Goldenrod
    qib: '#ffd700',       // Gold
};

interface PieSegment {
    label: string;
    value: number;
    color: string;
    displayValue: string;
    percentage: number;
}

export default function IPOAnalysisTile({ ipo }: { ipo: IPOData }) {
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('allocation');

    const getChartData = (): PieSegment[] => {
        const issueSize = ipo.issue_size_cr || 100;
        const lotSize = ipo.lot_size || 1;
        const retailSub = ipo.subscription_retail || 1;
        const niiSub = ipo.subscription_nii || 1;
        const qibSub = ipo.subscription_qib || 1;

        switch (selectedFilter) {
            case 'allocation':
                return [
                    { label: 'Retail', value: ALLOCATION_PERCENTAGES.retail, color: THEME_COLORS.retail, displayValue: `${ALLOCATION_PERCENTAGES.retail}%`, percentage: ALLOCATION_PERCENTAGES.retail },
                    { label: 'sNII', value: ALLOCATION_PERCENTAGES.sNII, color: THEME_COLORS.sNII, displayValue: `${ALLOCATION_PERCENTAGES.sNII}%`, percentage: ALLOCATION_PERCENTAGES.sNII },
                    { label: 'bNII', value: ALLOCATION_PERCENTAGES.bNII, color: THEME_COLORS.bNII, displayValue: `${ALLOCATION_PERCENTAGES.bNII}%`, percentage: ALLOCATION_PERCENTAGES.bNII },
                    { label: 'QIB', value: ALLOCATION_PERCENTAGES.qib, color: THEME_COLORS.qib, displayValue: `${ALLOCATION_PERCENTAGES.qib}%`, percentage: ALLOCATION_PERCENTAGES.qib },
                ];

            case 'issueSize': {
                const retailCr = (issueSize * ALLOCATION_PERCENTAGES.retail) / 100;
                const sNIICr = (issueSize * ALLOCATION_PERCENTAGES.sNII) / 100;
                const bNIICr = (issueSize * ALLOCATION_PERCENTAGES.bNII) / 100;
                const qibCr = (issueSize * ALLOCATION_PERCENTAGES.qib) / 100;
                return [
                    { label: 'Retail', value: retailCr, color: THEME_COLORS.retail, displayValue: `₹${retailCr.toFixed(1)}Cr`, percentage: ALLOCATION_PERCENTAGES.retail },
                    { label: 'sNII', value: sNIICr, color: THEME_COLORS.sNII, displayValue: `₹${sNIICr.toFixed(1)}Cr`, percentage: ALLOCATION_PERCENTAGES.sNII },
                    { label: 'bNII', value: bNIICr, color: THEME_COLORS.bNII, displayValue: `₹${bNIICr.toFixed(1)}Cr`, percentage: ALLOCATION_PERCENTAGES.bNII },
                    { label: 'QIB', value: qibCr, color: THEME_COLORS.qib, displayValue: `₹${qibCr.toFixed(1)}Cr`, percentage: ALLOCATION_PERCENTAGES.qib },
                ];
            }

            case 'subscription': {
                const totalSub = retailSub + niiSub + qibSub;
                const retailPct = (retailSub / totalSub) * 100;
                const niiPct = (niiSub / totalSub) * 100;
                const qibPct = (qibSub / totalSub) * 100;
                return [
                    { label: 'Retail', value: retailSub, color: THEME_COLORS.retail, displayValue: `${retailSub.toFixed(2)}x`, percentage: retailPct },
                    { label: 'NII', value: niiSub, color: THEME_COLORS.sNII, displayValue: `${niiSub.toFixed(2)}x`, percentage: niiPct },
                    { label: 'QIB', value: qibSub, color: THEME_COLORS.qib, displayValue: `${qibSub.toFixed(2)}x`, percentage: qibPct },
                ];
            }

            case 'lots': {
                const totalLots = Math.round((issueSize * 10000000) / (lotSize * 100));
                const retailLots = Math.round((totalLots * ALLOCATION_PERCENTAGES.retail) / 100);
                const sNIILots = Math.round((totalLots * ALLOCATION_PERCENTAGES.sNII) / 100);
                const bNIILots = Math.round((totalLots * ALLOCATION_PERCENTAGES.bNII) / 100);
                const qibLots = Math.round((totalLots * ALLOCATION_PERCENTAGES.qib) / 100);
                return [
                    { label: 'Retail', value: retailLots, color: THEME_COLORS.retail, displayValue: `${(retailLots / 1000).toFixed(1)}K`, percentage: ALLOCATION_PERCENTAGES.retail },
                    { label: 'sNII', value: sNIILots, color: THEME_COLORS.sNII, displayValue: `${(sNIILots / 1000).toFixed(1)}K`, percentage: ALLOCATION_PERCENTAGES.sNII },
                    { label: 'bNII', value: bNIILots, color: THEME_COLORS.bNII, displayValue: `${(bNIILots / 1000).toFixed(1)}K`, percentage: ALLOCATION_PERCENTAGES.bNII },
                    { label: 'QIB', value: qibLots, color: THEME_COLORS.qib, displayValue: `${(qibLots / 1000).toFixed(1)}K`, percentage: ALLOCATION_PERCENTAGES.qib },
                ];
            }

            case 'investors': {
                const baseInvestors = 10000;
                const retailInvestors = Math.round(baseInvestors * retailSub);
                const niiInvestors = Math.round((baseInvestors * niiSub) / 10);
                const qibInvestors = Math.round((baseInvestors * qibSub) / 100);
                const totalInvestors = retailInvestors + niiInvestors + qibInvestors;
                return [
                    { label: 'Retail', value: retailInvestors, color: THEME_COLORS.retail, displayValue: `${(retailInvestors / 1000).toFixed(1)}K`, percentage: (retailInvestors / totalInvestors) * 100 },
                    { label: 'NII', value: niiInvestors, color: THEME_COLORS.sNII, displayValue: `${(niiInvestors / 1000).toFixed(1)}K`, percentage: (niiInvestors / totalInvestors) * 100 },
                    { label: 'QIB', value: qibInvestors, color: THEME_COLORS.qib, displayValue: `${qibInvestors}`, percentage: (qibInvestors / totalInvestors) * 100 },
                ];
            }

            default:
                return [];
        }
    };

    const chartData = getChartData();
    const total = chartData.reduce((sum, segment) => sum + segment.value, 0);

    // Generate SVG pie chart paths with labels
    const generatePieSlices = () => {
        let currentAngle = -90;
        const centerX = 100;
        const centerY = 100;
        const radius = 85;
        const labelRadius = 55; // Radius for labels inside the pie

        return chartData.map((segment, index) => {
            const sliceAngle = (segment.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            const midAngle = (startAngle + endAngle) / 2;

            currentAngle = endAngle;

            // Convert angles to radians
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const midRad = (midAngle * Math.PI) / 180;

            // Calculate arc points
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            // Label position (inside the slice)
            const labelX = centerX + labelRadius * Math.cos(midRad);
            const labelY = centerY + labelRadius * Math.sin(midRad);

            // Large arc flag
            const largeArc = sliceAngle > 180 ? 1 : 0;

            const pathData = `
                M ${centerX} ${centerY}
                L ${x1} ${y1}
                A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                Z
            `;

            // Only show label if slice is big enough (> 10%)
            const showLabel = segment.percentage > 10;

            return (
                <g key={index}>
                    <path
                        d={pathData}
                        fill={segment.color}
                        stroke="#0a0a0a"
                        strokeWidth="2"
                        className={styles.pieSlice}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    />
                    {showLabel && (
                        <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={styles.sliceLabel}
                            fill="#0a0a0a"
                        >
                            <tspan x={labelX} dy="-0.4em" className={styles.sliceLabelValue}>{segment.displayValue}</tspan>
                            <tspan x={labelX} dy="1.1em" className={styles.sliceLabelPercent}>({segment.percentage.toFixed(0)}%)</tspan>
                        </text>
                    )}
                </g>
            );
        });
    };

    const getTotalLabel = (): string => {
        switch (selectedFilter) {
            case 'issueSize':
                return `Total: ₹${ipo.issue_size_cr || 0} Cr`;
            case 'subscription':
                return `Total: ${(ipo.subscription_total || 0).toFixed(2)}x`;
            default:
                return '';
        }
    };

    return (
        <div className={styles.tile}>
            <div className={styles.header}>
                <h3 className={styles.ipoName}>{ipo.ipo_name}</h3>
                <span className={styles.category}>{ipo.category || 'Mainboard'}</span>
            </div>

            <div className={styles.filterContainer}>
                <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
                    className={styles.filterDropdown}
                >
                    {filterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.chartContainer}>
                <svg viewBox="0 0 200 200" className={styles.pieChart}>
                    {generatePieSlices()}
                </svg>
            </div>

            {getTotalLabel() && (
                <div className={styles.totalLabel}>{getTotalLabel()}</div>
            )}

            <div className={styles.legend}>
                {chartData.map((segment, index) => (
                    <div key={index} className={styles.legendItem}>
                        <span
                            className={styles.legendColor}
                            style={{ backgroundColor: segment.color }}
                        />
                        <span className={styles.legendLabel}>{segment.label}</span>
                        <span className={styles.legendValue}>{segment.displayValue}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

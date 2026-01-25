'use client';

import React, { useState, useEffect } from 'react';
import styles from './IPOCategoryChart.module.css';
import { fetchCombinedIPOData } from '../../lib/api';

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

// Dynamic color palette
const CHART_COLORS = [
    '#FFED4E', // Yellow
    '#FF9500', // Orange
    '#007AFF', // Blue
    '#AF52DE', // Purple
    '#5AC8FA', // Teal
    '#34C759', // Green
    '#FF3B30', // Red
    '#FF6F61', // Coral
];

function getChartColor(index: number): string {
    return CHART_COLORS[index % CHART_COLORS.length];
}

// SEBI-defined allocation percentages
const ALLOCATION_PERCENTAGES = {
    retail: 35,
    qib: 50,
    nii: 15,
};

interface PieSegment {
    label: string;
    value: number;
    color: string;
    displayValue: string;
    subscribed?: string;
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
            // Fetch all IPOs (upcoming, open, closed) for the dropdown
            const allIPOs = await fetchCombinedIPOData();
            setIpos(allIPOs);
            if (allIPOs.length > 0) {
                setSelectedIPO(allIPOs[0]);
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
                    { label: 'Retail', value: ALLOCATION_PERCENTAGES.retail, color: getChartColor(0), displayValue: `${ALLOCATION_PERCENTAGES.retail}%`, subscribed: `${retailSub.toFixed(2)}x` },
                    { label: 'QIB', value: ALLOCATION_PERCENTAGES.qib, color: getChartColor(1), displayValue: `${ALLOCATION_PERCENTAGES.qib}%`, subscribed: `${qibSub.toFixed(2)}x` },
                    { label: 'NII', value: ALLOCATION_PERCENTAGES.nii, color: getChartColor(2), displayValue: `${ALLOCATION_PERCENTAGES.nii}%`, subscribed: `${niiSub.toFixed(2)}x` },
                ];

            case 'issueSize': {
                const retailCr = (issueSize * ALLOCATION_PERCENTAGES.retail) / 100;
                const qibCr = (issueSize * ALLOCATION_PERCENTAGES.qib) / 100;
                const niiCr = (issueSize * ALLOCATION_PERCENTAGES.nii) / 100;
                return [
                    { label: 'Retail', value: retailCr, color: getChartColor(0), displayValue: `₹${retailCr.toFixed(1)}Cr` },
                    { label: 'QIB', value: qibCr, color: getChartColor(1), displayValue: `₹${qibCr.toFixed(1)}Cr` },
                    { label: 'NII', value: niiCr, color: getChartColor(2), displayValue: `₹${niiCr.toFixed(1)}Cr` },
                ];
            }

            case 'subscription': {
                return [
                    { label: 'Retail', value: retailSub || 0.01, color: getChartColor(0), displayValue: `${retailSub.toFixed(2)}x` },
                    { label: 'QIB', value: qibSub || 0.01, color: getChartColor(1), displayValue: `${qibSub.toFixed(2)}x` },
                    { label: 'NII', value: niiSub || 0.01, color: getChartColor(2), displayValue: `${niiSub.toFixed(2)}x` },
                ];
            }

            default:
                return [];
        }
    };

    const chartData = getChartData();
    const total = chartData.reduce((sum, segment) => sum + segment.value, 0) || 1;

    const centerX = 170;
    const centerY = 160;
    const radius = 100;
    const innerLabelRadius = 55; // For labels inside the slice
    const labelRadius = 112; // For label line start (outside edge)
    const outerLabelRadius = 130; // For label line bend point

    // Threshold: slices with more than 25% get labels inside
    const INSIDE_LABEL_THRESHOLD = 0.25;

    // Generate filled pie slices and labels with smart placement
    const generatePieChart = () => {
        let currentAngle = -90;
        const slices: React.JSX.Element[] = [];
        const labels: React.JSX.Element[] = [];

        chartData.forEach((segment, index) => {
            const percentage = segment.value / total;
            const sliceAngle = percentage * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            const midAngle = startAngle + sliceAngle / 2;

            currentAngle = endAngle;

            // Convert angles to radians
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const midRad = (midAngle * Math.PI) / 180;

            // Calculate arc points for slice
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            const largeArc = sliceAngle > 180 ? 1 : 0;

            // Filled pie slice path
            const pathData = `
                M ${centerX} ${centerY}
                L ${x1} ${y1}
                A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                Z
            `;

            slices.push(
                <path
                    key={`slice-${index}`}
                    d={pathData}
                    fill={segment.color}
                    stroke="#1a3a3a"
                    strokeWidth="2"
                    className={styles.pieSlice}
                />
            );

            // Smart label placement based on slice size
            if (percentage >= INSIDE_LABEL_THRESHOLD) {
                // Large slice: place label INSIDE with name on top, value below
                const labelX = centerX + innerLabelRadius * Math.cos(midRad);
                const labelY = centerY + innerLabelRadius * Math.sin(midRad);

                labels.push(
                    <text
                        key={`label-${index}`}
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        className={styles.sliceLabel}
                        fill="#1a3a3a"
                    >
                        <tspan x={labelX} dy="-0.5em" fontSize="13" fontWeight="600">
                            {segment.label}
                        </tspan>
                        <tspan x={labelX} dy="1.2em" fontSize="15" fontWeight="700">
                            {segment.displayValue}
                        </tspan>
                    </text>
                );
            } else {
                // Small slice: place label OUTSIDE with connecting lines
                const edgeX = centerX + labelRadius * Math.cos(midRad);
                const edgeY = centerY + labelRadius * Math.sin(midRad);
                const outerX = centerX + outerLabelRadius * Math.cos(midRad);
                const outerY = centerY + outerLabelRadius * Math.sin(midRad);

                // Horizontal extension for the label
                const isRightSide = midAngle > -90 && midAngle < 90;
                const horizontalExtend = isRightSide ? 30 : -30;
                const textAnchor = isRightSide ? 'start' : 'end';
                const textX = outerX + horizontalExtend + (isRightSide ? 5 : -5);

                labels.push(
                    <g key={`label-${index}`}>
                        {/* First line: from edge to outer point */}
                        <line
                            x1={edgeX}
                            y1={edgeY}
                            x2={outerX}
                            y2={outerY}
                            stroke="#1a3a3a"
                            strokeWidth="1.5"
                        />
                        {/* Second line: horizontal extension */}
                        <line
                            x1={outerX}
                            y1={outerY}
                            x2={outerX + horizontalExtend}
                            y2={outerY}
                            stroke="#1a3a3a"
                            strokeWidth="1.5"
                        />
                        {/* Label text - stacked */}
                        <text
                            x={textX}
                            y={outerY}
                            textAnchor={textAnchor}
                            className={styles.sliceLabel}
                            fill="#1a3a3a"
                        >
                            <tspan x={textX} dy="-0.4em" fontSize="11" fontWeight="600">
                                {segment.label}
                            </tspan>
                            <tspan x={textX} dy="1.1em" fontSize="13" fontWeight="700">
                                {segment.displayValue}
                            </tspan>
                        </text>
                    </g>
                );
            }
        });

        return { slices, labels };
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

    const { slices, labels } = generatePieChart();

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
                {/* Pie Chart with labels */}
                <div className={styles.pieChartWrapper}>
                    <svg width="340" height="340" viewBox="0 0 340 320" className={styles.pieSvg}>
                        {slices}
                        {labels}
                    </svg>
                    {/* Total displayed below the pie chart */}
                    <div className={styles.totalBelow}>
                        <div className={styles.totalValue}>{getCenterValue()}</div>
                        <div className={styles.totalLabel}>{getCenterLabel()}</div>
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
                                        <span className={styles.legendPercent}> ({segment.subscribed} subscribed)</span>
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

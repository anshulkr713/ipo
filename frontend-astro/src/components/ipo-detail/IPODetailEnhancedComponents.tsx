'use client';
import { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ComposedChart
} from 'recharts';
import { supabase } from '../../lib/supabase';
import styles from './IPODetailEnhanced.module.css';

// ==========================================
// TYPES & CONSTANTS
// ==========================================
interface GMPDataPoint {
    date: string;
    gmp_amount: number;
    gmp_percentage: number;
    kostak_rate?: number;
    subject_rate?: number;
}

interface SubscriptionData {
    subscription_qib?: number;
    subscription_nii?: number;
    subscription_shni?: number;
    subscription_bhni?: number;
    subscription_retail?: number;
    subscription_total?: number;
    subscription_day?: number;
    applications_count_total?: number;
    created_at?: string;
}

const COLORS = {
    primary: '#1a3a3a',
    secondary: '#22c55e',
    accent: '#3b82f6',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
};

// ==========================================
// ENHANCED HERO SECTION
// ==========================================
interface EnhancedHeroProps {
    companyName: string;
    status: string;
    category?: string;
    issueType?: string;
    issueSize: number;
    freshIssue?: number;
    ofs?: number;
    gmp: number;
    gmpPercentage: number;
    estimatedListing: number;
    kostakRate?: number;
    subjectRate?: number;
    subscriptionData: any;
    openDate: string;
    closeDate: string;
    industry?: string;
    headquarters?: string;
    established?: number;
}

export function EnhancedHeroSection(props: EnhancedHeroProps) {
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const now = new Date();
            const targetDate = props.status === 'open' ? new Date(props.closeDate) : new Date(props.openDate);
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0 && props.status === 'open') {
                setIsLive(false);
                setTimeRemaining('Closed');
                return;
            }
            if (diff <= 0) {
                setTimeRemaining('');
                return;
            }

            setIsLive(props.status === 'open');
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) setTimeRemaining(`${days}d ${hours}h remaining`);
            else if (hours > 0) setTimeRemaining(`${hours}h ${minutes}m remaining`);
            else setTimeRemaining(`${minutes}m remaining`);
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 60000);
        return () => clearInterval(interval);
    }, [props.status, props.openDate, props.closeDate]);

    return (
        <div className={styles.enhancedHero}>
            {timeRemaining && (
                <div className={`${styles.statusBanner} ${isLive ? styles.statusLive : ''}`}>
                    <div className={styles.bannerContent}>
                        <span className={styles.bannerIcon}>{isLive ? '🔴 LIVE' : '⏰'}</span>
                        <span>{isLive ? `IPO Closes in ${timeRemaining}` : `Opens in ${timeRemaining}`}</span>
                    </div>
                </div>
            )}

            <div className={styles.companyCard}>
                <div className={styles.companyHeader}>
                    <div className={styles.companyLogo}>{props.companyName.charAt(0).toUpperCase()}</div>
                    <div className={styles.companyInfo}>
                        <h1 className={styles.companyName}>{props.companyName}</h1>
                        <div className={styles.companyMeta}>
                            {props.industry && <span className={styles.metaTag}>🏭 {props.industry}</span>}
                            {props.headquarters && <span className={styles.metaTag}>📍 {props.headquarters}</span>}
                        </div>
                        <div className={styles.statusBadges}>
                            <span className={`${styles.badge} ${styles[`badge${props.status.charAt(0).toUpperCase() + props.status.slice(1)}`]}`}>
                                ● {props.status.toUpperCase()}
                            </span>
                            {props.category && <span className={styles.badge}>{props.category}</span>}
                            {props.issueType && <span className={styles.badge}>{props.issueType}</span>}
                        </div>
                    </div>
                </div>

                {(props.freshIssue || props.ofs) && (
                    <div className={styles.issueSizeBar}>
                        {props.freshIssue && (
                            <div className={styles.freshIssue} style={{ width: `${(props.freshIssue / props.issueSize) * 100}%` }}>
                                <span>Fresh: ₹{props.freshIssue} Cr</span>
                            </div>
                        )}
                        {props.ofs && (
                            <div className={styles.ofsIssue} style={{ width: `${(props.ofs / props.issueSize) * 100}%` }}>
                                <span>OFS: ₹{props.ofs} Cr</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.metricsGrid}>
                <div className={styles.gmpBox}>
                    <div className={styles.boxHeader}>
                        <span className={styles.boxIcon}>📈</span>
                        <span className={styles.boxTitle}>Grey Market Premium</span>
                    </div>
                    <div className={styles.boxContent}>
                        <div className={styles.gmpMain}>
                            <span className={styles.gmpLabel}>Current GMP</span>
                            <span className={`${styles.gmpValue} ${props.gmp >= 0 ? styles.positive : styles.negative}`}>₹{props.gmp}</span>
                            <span className={`${styles.gmpPercentage} ${props.gmpPercentage >= 0 ? styles.positive : styles.negative}`}>
                                {props.gmpPercentage >= 0 ? '+' : ''}{props.gmpPercentage.toFixed(1)}%
                            </span>
                        </div>
                        <div className={styles.gmpDetails}>
                            <div className={styles.gmpRow}><span>Expected Listing</span><span className={styles.highlight}>₹{props.estimatedListing}</span></div>
                            {props.kostakRate > 0 && <div className={styles.gmpRow}><span>Kostak Rate</span><span>₹{props.kostakRate}</span></div>}
                            {props.subjectRate > 0 && <div className={styles.gmpRow}><span>Subject Rate</span><span>₹{props.subjectRate}</span></div>}
                        </div>
                    </div>
                </div>

                <div className={styles.subscriptionBox}>
                    <div className={styles.boxHeader}>
                        <span className={styles.boxIcon}>📊</span>
                        <span className={styles.boxTitle}>Subscription Status</span>
                        {props.status === 'open' && <span className={styles.liveBadge}>● LIVE</span>}
                    </div>
                    <div className={styles.boxContent}>
                        <div className={styles.subGrid}>
                            {['QIB', 'sNII', 'bNII', 'Retail'].map((cat) => {
                                const key = cat === 'QIB' ? 'subscription_qib' : cat === 'sNII' ? 'subscription_shni' : cat === 'bNII' ? 'subscription_bhni' : 'subscription_retail';
                                return (
                                    <div key={cat} className={styles.subItem}>
                                        <span className={styles.subCat}>{cat}</span>
                                        <span className={styles.subVal}>{(props.subscriptionData?.[key] || 0).toFixed(2)}x</span>
                                    </div>
                                );
                            })}
                            <div className={`${styles.subItem} ${styles.subTotal}`}>
                                <span className={styles.subCat}>Total</span>
                                <span className={styles.subVal}>{(props.subscriptionData?.subscription_total || 0).toFixed(2)}x</span>
                            </div>
                        </div>
                        {props.subscriptionData?.applications_count_total > 0 && (
                            <div className={styles.applicationsCount}>
                                <span className={styles.applicationsIcon}>👥</span>
                                <span>{props.subscriptionData.applications_count_total.toLocaleString('en-IN')} Applications</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// GMP TREND CHART
// ==========================================
interface GMPTrendProps {
    gmpHistory: GMPDataPoint[];
    issuePrice: number;
    companyName: string;
}

export function GMPTrendChart({ gmpHistory, issuePrice, companyName }: GMPTrendProps) {
    if (!gmpHistory || gmpHistory.length === 0) return null;

    const chartData = gmpHistory
        .map(item => ({
            date: new Date(item.date || item.created_at || item.recorded_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            gmp: item.gmp_amount,
            percentage: item.gmp_percentage,
            expectedListing: issuePrice + item.gmp_amount,
        }))
        .reverse()
        .slice(-14);

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📈 GMP Trend Analysis</h2>
            <div className={styles.gmpTrendContainer}>
                <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '3px solid #1a3a3a' }} />
                        <Legend />
                        <Line type="monotone" dataKey="gmp" stroke={COLORS.primary} strokeWidth={3} name="GMP (₹)" dot={{ fill: COLORS.primary, r: 4 }} />
                        <Line type="monotone" dataKey="expectedListing" stroke={COLORS.secondary} strokeWidth={3} name="Expected Listing" dot={{ fill: COLORS.secondary, r: 4 }} />
                    </ComposedChart>
                </ResponsiveContainer>
                <div className={styles.gmpInsights}>
                    <div className={styles.insightCard}>
                        <span className={styles.insightLabel}>Avg GMP (7 days)</span>
                        <span className={styles.insightValue}>₹{(chartData.slice(-7).reduce((sum, item) => sum + item.gmp, 0) / Math.min(7, chartData.length)).toFixed(0)}</span>
                    </div>
                    <div className={styles.insightCard}>
                        <span className={styles.insightLabel}>Peak GMP</span>
                        <span className={styles.insightValue}>₹{Math.max(...chartData.map(item => item.gmp))}</span>
                    </div>
                    <div className={styles.insightCard}>
                        <span className={styles.insightLabel}>Trend</span>
                        <span className={styles.insightValue}>
                            {chartData.length >= 2 && chartData[chartData.length - 1].gmp > chartData[chartData.length - 2].gmp ? '📈 Rising' : '📉 Falling'}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ==========================================
// SUBSCRIPTION DASHBOARD
// ==========================================
interface SubscriptionDashboardProps {
    subscriptionData: SubscriptionData;
    subscriptionHistory: SubscriptionData[];
    status: string;
    ipoId: number;
    companyName: string;
}

export function SubscriptionDashboard({ subscriptionData, subscriptionHistory, status, ipoId }: SubscriptionDashboardProps) {
    const [liveData, setLiveData] = useState(subscriptionData);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        if (status !== 'open') return;
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/subscription/${ipoId}`);
                if (response.ok) {
                    const data = await response.json();
                    setLiveData(data);
                    setLastUpdated(new Date());
                }
            } catch (error) {
                console.error('Failed to fetch live subscription:', error);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [status, ipoId]);

    const categories = [
        { name: 'QIB', value: liveData?.subscription_qib || 0, color: COLORS.primary },
        { name: 'sNII', value: liveData?.subscription_shni || 0, color: COLORS.secondary },
        { name: 'bNII', value: liveData?.subscription_bhni || 0, color: COLORS.accent },
        { name: 'Retail', value: liveData?.subscription_retail || 0, color: COLORS.warning },
    ];

    const historyData = subscriptionHistory.map((item, index) => ({
        day: `Day ${item.subscription_day || index + 1}`,
        QIB: item.subscription_qib || 0,
        sNII: item.subscription_shni || 0,
        bNII: item.subscription_bhni || 0,
        Retail: item.subscription_retail || 0,
    })).slice(-5);

    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>📊 Live Subscription Tracker</h2>
                {status === 'open' && (
                    <div className={styles.lastUpdated}>
                        <span className={styles.liveDot}>●</span>
                        Updated: {lastUpdated.toLocaleTimeString('en-IN')}
                    </div>
                )}
            </div>

            <div className={styles.gaugeGrid}>
                {categories.map((category) => (
                    <div key={category.name} className={styles.gaugeCard}>
                        <h3 className={styles.gaugeTitle}>{category.name}</h3>
                        <div className={styles.gaugeValue}>{category.value.toFixed(2)}x</div>
                        <div className={styles.gaugeBar}>
                            <div className={styles.gaugeFill} style={{ width: `${Math.min(category.value * 20, 100)}%`, backgroundColor: category.color }} />
                        </div>
                        <div className={styles.gaugeStatus}>
                            {category.value >= 1 ? `✅ ${((category.value - 1) * 100).toFixed(0)}% Oversubscribed` : `⏳ ${(category.value * 100).toFixed(0)}% Filled`}
                        </div>
                    </div>
                ))}
            </div>

            {historyData.length > 1 && (
                <div className={styles.historyChart}>
                    <h3 className={styles.chartTitle}>Day-wise Subscription Progress</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={historyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '3px solid #1a3a3a' }} />
                            <Legend />
                            <Bar dataKey="QIB" fill={COLORS.primary} name="QIB" />
                            <Bar dataKey="sNII" fill={COLORS.secondary} name="sNII" />
                            <Bar dataKey="bNII" fill={COLORS.accent} name="bNII" />
                            <Bar dataKey="Retail" fill={COLORS.warning} name="Retail" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className={styles.heatMap}>
                <h3 className={styles.chartTitle}>Subscription Heat Map</h3>
                <div className={styles.heatMapGrid}>
                    {categories.map((category) => (
                        <div key={category.name} className={styles.heatCell} style={{
                            backgroundColor: category.value >= 5 ? '#22c55e' : category.value >= 2 ? '#f59e0b' : category.value >= 1 ? '#3b82f6' : '#e2e8f0'
                        }}>
                            <span className={styles.heatLabel}>{category.name}</span>
                            <span className={styles.heatValue}>{category.value.toFixed(2)}x</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ==========================================
// FINANCIAL PERFORMANCE SUITE
// ==========================================
interface FinancialData {
    financial_year: string;
    revenue?: number;
    profit_after_tax?: number;
    ebitda?: number;
    eps?: number;
    operating_profit_margin?: number;
    net_profit_margin?: number;
    debt_equity_ratio?: number;
    roe?: number;
    ronw?: number;
}

interface FinancialPerformanceProps {
    financials: FinancialData[];
    comparables: any[];
    companyName: string;
}

export function FinancialPerformanceSuite({ financials, comparables, companyName }: FinancialPerformanceProps) {
    const [activeTab, setActiveTab] = useState<'revenue' | 'profitability' | 'margins' | 'ratios'>('revenue');

    if (!financials || financials.length === 0) return null;

    const sortedFinancials = [...financials].sort((a, b) => a.financial_year.localeCompare(b.financial_year));
    const latestFinancial = sortedFinancials[sortedFinancials.length - 1];

    const calculateGrowthRate = (key: keyof FinancialData): number => {
        if (sortedFinancials.length < 2) return 0;
        const latest = sortedFinancials[sortedFinancials.length - 1][key] as number;
        const previous = sortedFinancials[sortedFinancials.length - 2][key] as number;
        if (!latest || !previous || previous === 0) return 0;
        return ((latest - previous) / previous) * 100;
    };

    const revenueGrowth = calculateGrowthRate('revenue');
    const profitGrowth = calculateGrowthRate('profit_after_tax');

    const revenueData = sortedFinancials.map(f => ({
        year: f.financial_year,
        revenue: f.revenue || 0,
        profit: f.profit_after_tax || 0,
        ebitda: f.ebitda || 0,
    }));

    const radarData = [
        { metric: 'ROE', value: latestFinancial.roe || 0 },
        { metric: 'RONW', value: latestFinancial.ronw || 0 },
        { metric: 'OPM', value: latestFinancial.operating_profit_margin || 0 },
        { metric: 'NPM', value: latestFinancial.net_profit_margin || 0 },
        { metric: 'EPS Growth', value: calculateGrowthRate('eps') },
    ];

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>💰 Financial Performance Analysis</h2>

            <div className={styles.growthCards}>
                <div className={`${styles.growthCard} ${revenueGrowth >= 0 ? styles.positive : styles.negative}`}>
                    <span className={styles.growthIcon}>{revenueGrowth >= 0 ? '📈' : '📉'}</span>
                    <div className={styles.growthContent}>
                        <span className={styles.growthLabel}>Revenue Growth (YoY)</span>
                        <span className={styles.growthValue}>{revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%</span>
                    </div>
                </div>
                <div className={`${styles.growthCard} ${profitGrowth >= 0 ? styles.positive : styles.negative}`}>
                    <span className={styles.growthIcon}>{profitGrowth >= 0 ? '📈' : '📉'}</span>
                    <div className={styles.growthContent}>
                        <span className={styles.growthLabel}>Profit Growth (YoY)</span>
                        <span className={styles.growthValue}>{profitGrowth >= 0 ? '+' : ''}{profitGrowth.toFixed(1)}%</span>
                    </div>
                </div>
                <div className={styles.growthCard}>
                    <span className={styles.growthIcon}>💵</span>
                    <div className={styles.growthContent}>
                        <span className={styles.growthLabel}>Latest Revenue</span>
                        <span className={styles.growthValue}>₹{(latestFinancial.revenue || 0).toFixed(0)} Cr</span>
                    </div>
                </div>
                <div className={styles.growthCard}>
                    <span className={styles.growthIcon}>💎</span>
                    <div className={styles.growthContent}>
                        <span className={styles.growthLabel}>Latest PAT</span>
                        <span className={styles.growthValue}>₹{(latestFinancial.profit_after_tax || 0).toFixed(0)} Cr</span>
                    </div>
                </div>
            </div>

            <div className={styles.tabNav}>
                {['revenue', 'profitability', 'margins', 'ratios'].map((tab) => (
                    <button key={tab} className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`} onClick={() => setActiveTab(tab as any)}>
                        {tab === 'revenue' ? 'Revenue & Profit' : tab === 'profitability' ? 'Profitability' : tab === 'margins' ? 'Margins' : 'Ratios'}
                    </button>
                ))}
            </div>

            <div className={styles.chartContent}>
                {activeTab === 'revenue' && (
                    <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '3px solid #1a3a3a' }} />
                            <Legend />
                            <Bar dataKey="revenue" fill={COLORS.primary} name="Revenue (₹Cr)" />
                            <Bar dataKey="profit" fill={COLORS.secondary} name="PAT (₹Cr)" />
                            <Line type="monotone" dataKey="ebitda" stroke={COLORS.accent} strokeWidth={3} name="EBITDA" />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}

                {activeTab === 'profitability' && (
                    <div className={styles.radarContainer}>
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Radar name={companyName} dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {activeTab === 'ratios' && (
                    <div className={styles.ratiosGrid}>
                        <div className={styles.ratioCard}>
                            <span className={styles.ratioLabel}>Debt-to-Equity</span>
                            <span className={styles.ratioValue}>{latestFinancial.debt_equity_ratio?.toFixed(2) || 'N/A'}</span>
                            <span className={styles.ratioStatus}>{(latestFinancial.debt_equity_ratio || 0) < 1 ? '✅ Healthy' : '⚠️ Monitor'}</span>
                        </div>
                        <div className={styles.ratioCard}>
                            <span className={styles.ratioLabel}>ROE</span>
                            <span className={styles.ratioValue}>{latestFinancial.roe?.toFixed(1) || 'N/A'}%</span>
                            <span className={styles.ratioStatus}>{(latestFinancial.roe || 0) > 15 ? '✅ Excellent' : '⚠️ Average'}</span>
                        </div>
                        <div className={styles.ratioCard}>
                            <span className={styles.ratioLabel}>RONW</span>
                            <span className={styles.ratioValue}>{latestFinancial.ronw?.toFixed(1) || 'N/A'}%</span>
                            <span className={styles.ratioStatus}>{(latestFinancial.ronw || 0) > 15 ? '✅ Strong' : '⚠️ Weak'}</span>
                        </div>
                        <div className={styles.ratioCard}>
                            <span className={styles.ratioLabel}>EPS</span>
                            <span className={styles.ratioValue}>₹{latestFinancial.eps?.toFixed(2) || 'N/A'}</span>
                            <span className={styles.ratioStatus}>{calculateGrowthRate('eps') > 0 ? '📈 Growing' : '📉 Declining'}</span>
                        </div>
                    </div>
                )}

                {activeTab === 'margins' && (
                    <div className={styles.ratiosGrid}>
                        <div className={styles.ratioCard}>
                            <span className={styles.ratioLabel}>Operating Margin</span>
                            <span className={styles.ratioValue}>{latestFinancial.operating_profit_margin?.toFixed(1) || 'N/A'}%</span>
                        </div>
                        <div className={styles.ratioCard}>
                            <span className={styles.ratioLabel}>Net Profit Margin</span>
                            <span className={styles.ratioValue}>{latestFinancial.net_profit_margin?.toFixed(1) || 'N/A'}%</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

// ==========================================
// IPO RETURN CALCULATOR
// ==========================================
interface CalculatorProps {
    issuePrice: number;
    gmp: number;
    lotSize: number;
    companyName: string;
}

export function IPOReturnCalculator({ issuePrice, gmp, lotSize }: CalculatorProps) {
    const [lots, setLots] = useState(1);
    const [customGMP, setCustomGMP] = useState(gmp);
    const [useCustomGMP, setUseCustomGMP] = useState(false);

    const activeGMP = useCustomGMP ? customGMP : gmp;
    const shares = lots * lotSize;
    const investment = shares * issuePrice;
    const expectedListing = issuePrice + activeGMP;
    const listingValue = shares * expectedListing;
    const potentialGain = listingValue - investment;
    const gainPercentage = (potentialGain / investment) * 100;

    return (
        <div className={styles.calculator}>
            <h3 className={styles.calculatorTitle}>💰 Return Calculator</h3>
            <div className={styles.calculatorForm}>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Number of Lots</label>
                    <input type="number" className={styles.formInput} value={lots} onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))} min="1" />
                    <span className={styles.formHint}>= {shares} shares (₹{investment.toLocaleString('en-IN')})</span>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formCheckbox}>
                        <input type="checkbox" checked={useCustomGMP} onChange={(e) => setUseCustomGMP(e.target.checked)} />
                        <span>Use Custom GMP</span>
                    </label>
                    {useCustomGMP && <input type="number" className={styles.formInput} value={customGMP} onChange={(e) => setCustomGMP(parseFloat(e.target.value) || 0)} />}
                </div>
            </div>
            <div className={styles.calculatorResults}>
                <div className={styles.resultRow}><span className={styles.resultLabel}>Investment</span><span className={styles.resultValue}>₹{investment.toLocaleString('en-IN')}</span></div>
                <div className={styles.resultRow}><span className={styles.resultLabel}>Expected Listing</span><span className={styles.resultValue}>₹{expectedListing}</span></div>
                <div className={styles.resultRow}><span className={styles.resultLabel}>Listing Value</span><span className={styles.resultValue}>₹{listingValue.toLocaleString('en-IN')}</span></div>
                <div className={`${styles.resultRow} ${styles.resultHighlight}`}>
                    <span className={styles.resultLabel}>Potential Gain/Loss</span>
                    <span className={`${styles.resultValue} ${potentialGain >= 0 ? styles.positive : styles.negative}`}>
                        ₹{potentialGain.toLocaleString('en-IN')} ({gainPercentage >= 0 ? '+' : ''}{gainPercentage.toFixed(2)}%)
                    </span>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// AI LISTING PREDICTOR (FastAPI Powered)
// ==========================================
export function AIListingPredictor({ gmpPercent, subscriptionTotal, category }: any) {
    const [prediction, setPrediction] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const checkProbability = async () => {
        setLoading(true);
        setError(false);
        try {
            // Call FastAPI Backend
            const response = await fetch('http://localhost:8000/predict-listing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gmp_percent: gmpPercent,
                    subscription_total: subscriptionTotal,
                    category: category || 'Mainboard'
                })
            });

            if (!response.ok) throw new Error('API Failed');
            const data = await response.json();
            setPrediction(data);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.calculator} style={{ border: '2px dashed #3b82f6', background: '#eff6ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className={styles.calculatorTitle} style={{ margin: 0, color: '#1e40af' }}>🤖 AI Listing Predictor</h3>
                <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: 'white', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>BETA</span>
            </div>

            {!prediction && !loading && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <p style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                        Use our AI model to analyze GMP & Subscription trends to predict listing success.
                    </p>
                    <button
                        onClick={checkProbability}
                        className={styles.submitBtn}
                        style={{ background: '#3b82f6', borderColor: '#2563eb' }}
                    >
                        🔮 Analyze Listing Probability
                    </button>
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className={styles.pulseDot} style={{ background: '#3b82f6', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: '#3b82f6', fontWeight: 600 }}>Crunching market data...</p>
                </div>
            )}

            {prediction && (
                <div className={styles.probabilityDisplay} style={{ flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
                        <div className={styles.probabilityCircle} style={{ width: '100px', height: '100px' }}>
                            <svg viewBox="0 0 100 100" className={styles.probabilitySvg}>
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#dbeafe" strokeWidth="10" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none"
                                    stroke={prediction.probability_percent > 70 ? '#22c55e' : prediction.probability_percent > 40 ? '#f59e0b' : '#ef4444'}
                                    strokeWidth="10"
                                    strokeDasharray={`${prediction.probability_percent * 2.827} 282.7`}
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className={styles.probabilityText}>
                                <span className={styles.probabilityValue} style={{ fontSize: '1.25rem' }}>{prediction.probability_percent}%</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>AI Verdict</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e40af' }}>{prediction.sentiment}</div>
                            <div style={{ fontSize: '0.875rem', color: '#3b82f6' }}>Est. Gain: {prediction.estimated_gain_min.toFixed(0)}% - {prediction.estimated_gain_max.toFixed(0)}%</div>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '0.75rem', borderRadius: '4px', border: '1px solid #bfdbfe', fontSize: '0.875rem', color: '#1e40af' }}>
                        <strong>Analysis:</strong> {prediction.analysis}
                    </div>
                    <button onClick={() => setPrediction(null)} style={{ fontSize: '0.75rem', textDecoration: 'underline', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Reset Analysis</button>
                </div>
            )}

            {error && (
                <div style={{ textAlign: 'center', color: '#ef4444' }}>
                    <p>Failed to connect to AI server. ensure backend is running.</p>
                    <button onClick={checkProbability} style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem' }}>Retry</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
// ALLOTMENT PROBABILITY CALCULATOR
// ==========================================
export function AllotmentProbabilityCalculator({ subscriptionData, lotSize, minInvestment }: any) {
    const [category, setCategory] = useState<'retail' | 'sNII' | 'bNII'>('retail');
    const [numLots, setNumLots] = useState(1);

    const subscription = category === 'retail' ? subscriptionData?.subscription_retail || 0
        : category === 'sNII' ? subscriptionData?.subscription_shni || 0
            : subscriptionData?.subscription_bhni || 0;

    const probability = subscription > 0 ? Math.min((1 / subscription) * 100, 100) : 0;

    return (
        <div className={styles.calculator}>
            <h3 className={styles.calculatorTitle}>🎲 Allotment Probability</h3>
            <div className={styles.calculatorForm}>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <select className={styles.formSelect} value={category} onChange={(e) => setCategory(e.target.value as any)}>
                        <option value="retail">Retail (up to ₹2L)</option>
                        <option value="sNII">sNII (₹2L - ₹10L)</option>
                        <option value="bNII">bNII (above ₹10L)</option>
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Number of Lots</label>
                    <input type="number" className={styles.formInput} value={numLots} onChange={(e) => setNumLots(Math.max(1, parseInt(e.target.value) || 1))} min="1" />
                </div>
            </div>
            <div className={styles.probabilityDisplay}>
                <div className={styles.probabilityCircle}>
                    <svg viewBox="0 0 100 100" className={styles.probabilitySvg}>
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke={COLORS.secondary} strokeWidth="10" strokeDasharray={`${probability * 2.827} 282.7`} transform="rotate(-90 50 50)" />
                    </svg>
                    <div className={styles.probabilityText}>
                        <span className={styles.probabilityValue}>{probability.toFixed(1)}%</span>
                        <span className={styles.probabilityLabel}>Chance</span>
                    </div>
                </div>
                <div className={styles.allotmentDetails}>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Subscription</span><span className={styles.detailValue}>{subscription.toFixed(2)}x</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Investment</span><span className={styles.detailValue}>₹{(numLots * minInvestment).toLocaleString('en-IN')}</span></div>
                </div>
            </div>
            <div className={styles.allotmentNote}><strong>Note:</strong> Estimated probability based on current subscription data.</div>
        </div>
    );
}

// ==========================================
// ENHANCED TIMELINE
// ==========================================
export function EnhancedTimeline({ openDate, closeDate, allotmentDate, listingDate, currentStatus }: any) {
    const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBA';

    // Helper to determine status
    const getStatus = (milestoneDate: string) => {
        if (!milestoneDate) return 'upcoming';
        const now = new Date();
        const date = new Date(milestoneDate);
        return now > date ? 'completed' : 'upcoming';
    };

    const steps = [
        { label: 'Open', date: openDate, status: getStatus(openDate) },
        { label: 'Close', date: closeDate, status: getStatus(closeDate) },
        { label: 'Allotment', date: allotmentDate, status: currentStatus === 'listed' ? 'completed' : getStatus(allotmentDate) },
        { label: 'Listing', date: listingDate, status: currentStatus === 'listed' ? 'completed' : getStatus(listingDate) }
    ];

    // Determine progress bar fill width
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const progressWidth = `${Math.min(100, (completedSteps / (steps.length - 1)) * 100)}%`;

    return (
        <section className={styles.section} style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem', fontSize: '1rem' }}>🗓️ IPO Timeline</h2>
            <div className={styles.compactTimeline}>
                {/* Progress Bar Background */}
                <div className={styles.progressTrack}>
                    <div className={styles.progressBar} style={{ width: progressWidth }}></div>
                </div>

                {/* Steps */}
                <div className={styles.stepsContainer}>
                    {steps.map((step, index) => (
                        <div key={index} className={`${styles.stepItem} ${styles[step.status]}`}>
                            <div className={styles.stepDot}></div>
                            <div className={styles.stepContent}>
                                <span className={styles.stepLabel}>{step.label}</span>
                                <span className={styles.stepDate}>{formatDate(step.date)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ==========================================
// RISK ASSESSMENT MATRIX
// ==========================================
export function RiskAssessmentMatrix({ risks, companyName }: any) {
    const [expandedRisk, setExpandedRisk] = useState<number | null>(null);
    if (!risks || risks.length === 0) return null;

    const risksByLevel = { High: risks.filter((r: any) => r.risk_level === 'High'), Medium: risks.filter((r: any) => r.risk_level === 'Medium'), Low: risks.filter((r: any) => r.risk_level === 'Low') };
    const getRiskColor = (level: string) => level === 'High' ? COLORS.danger : level === 'Medium' ? COLORS.warning : COLORS.secondary;

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>⚠️ Risk Assessment Matrix</h2>
            <div className={styles.riskSummary}>
                {Object.entries(risksByLevel).map(([level, items]) => (
                    <div key={level} className={styles.riskSummaryCard} style={{ borderColor: getRiskColor(level) }}>
                        <span className={styles.riskCount}>{(items as any[]).length}</span>
                        <span className={styles.riskLevel}>{level} Risk</span>
                    </div>
                ))}
            </div>
            <div className={styles.riskGrid}>
                {risks.map((risk: any, index: number) => (
                    <div key={index} className={styles.riskCard} style={{ borderLeftColor: getRiskColor(risk.risk_level) }}>
                        <div className={styles.riskHeader} onClick={() => setExpandedRisk(expandedRisk === index ? null : index)}>
                            <div className={styles.riskTitle}>
                                <span className={styles.riskIndicator} style={{ backgroundColor: getRiskColor(risk.risk_level) }} />
                                <span className={styles.riskCategory}>{risk.risk_category}</span>
                            </div>
                            <span className={styles.riskToggle}>{expandedRisk === index ? '−' : '+'}</span>
                        </div>
                        {expandedRisk === index && <div className={styles.riskDetails}><p className={styles.riskDescription}>{risk.risk_description}</p></div>}
                    </div>
                ))}
            </div>
        </section>
    );
}

// ==========================================
// BROKER RECOMMENDATIONS
// ==========================================
export function BrokerRecommendations({ reviews, companyName }: any) {
    if (!reviews || reviews.length === 0) return null;

    const subscribeCount = reviews.filter((r: any) => r.recommendation === 'Subscribe').length;
    const avoidCount = reviews.filter((r: any) => r.recommendation === 'Avoid').length;
    const neutralCount = reviews.filter((r: any) => r.recommendation === 'Neutral').length;
    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews;

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🎯 Broker Recommendations</h2>
            <div className={styles.ratingOverview}>
                <div className={styles.ratingMain}>
                    <div className={styles.ratingScore}>
                        <span className={styles.ratingNumber}>{avgRating.toFixed(1)}</span>
                        <span className={styles.ratingOutOf}>/5.0</span>
                    </div>
                    <div className={styles.ratingStars}>{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</div>
                    <div className={styles.ratingCount}>Based on {totalReviews} reviews</div>
                </div>
                <div className={styles.ratingDistribution}>
                    <div className={styles.distributionBar}>
                        {subscribeCount > 0 && <div className={styles.distributionSegment} style={{ width: `${(subscribeCount / totalReviews) * 100}%`, backgroundColor: COLORS.secondary }}>{subscribeCount} Subscribe</div>}
                        {neutralCount > 0 && <div className={styles.distributionSegment} style={{ width: `${(neutralCount / totalReviews) * 100}%`, backgroundColor: COLORS.warning }}>{neutralCount} Neutral</div>}
                        {avoidCount > 0 && <div className={styles.distributionSegment} style={{ width: `${(avoidCount / totalReviews) * 100}%`, backgroundColor: COLORS.danger }}>{avoidCount} Avoid</div>}
                    </div>
                </div>
            </div>
            <div className={styles.reviewsGrid}>
                {reviews.slice(0, 6).map((review: any, index: number) => (
                    <div key={index} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                            <span className={styles.reviewerName}>{review.reviewer_name}</span>
                            {review.rating && <span className={styles.reviewRating}>{review.rating}★</span>}
                        </div>
                        {review.recommendation && <div className={styles.recommendation} style={{ backgroundColor: review.recommendation === 'Subscribe' ? '#dcfce7' : review.recommendation === 'Avoid' ? '#fee2e2' : '#fef3c7', color: review.recommendation === 'Subscribe' ? COLORS.secondary : review.recommendation === 'Avoid' ? COLORS.danger : COLORS.warning }}>{review.recommendation}</div>}
                        {review.review_summary && <p className={styles.reviewSummary}>{review.review_summary}</p>}
                    </div>
                ))}
            </div>
        </section>
    );
}

// ==========================================
// SHAREHOLDING VISUALIZATION
// ==========================================
export function ShareholdingVisualization({ shareholding, companyName }: any) {
    // Mock Data Fallback
    const demoData = [
        { holding_type: 'Pre-IPO', promoter_holding_percentage: 95, public_holding_percentage: 5 },
        { holding_type: 'Post-IPO', promoter_holding_percentage: 70, public_holding_percentage: 30 }
    ];
    const dataToUse = (shareholding && shareholding.length > 0) ? shareholding : demoData;
    const isMock = (!shareholding || shareholding.length === 0);

    const preIPO = dataToUse.find((s: any) => s.holding_type === 'Pre-IPO');
    const postIPO = dataToUse.find((s: any) => s.holding_type === 'Post-IPO');
    if (!preIPO && !postIPO) return null;

    const pieData = (data: any) => [
        { name: 'Promoters', value: data?.promoter_holding_percentage || 0, color: COLORS.primary },
        { name: 'Public', value: data?.public_holding_percentage || 0, color: COLORS.secondary },
    ];

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📊 Shareholding Pattern</h2>
            <div className={styles.shareholdingGrid}>
                {[{ label: 'Pre-IPO', data: preIPO }, { label: 'Post-IPO', data: postIPO }].filter(item => item.data).map((item) => (
                    <div key={item.label} className={styles.shareholdingCard}>
                        <h3 className={styles.shareholdingTitle}>{item.label}</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={pieData(item.data)} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`} stroke="#1a3a3a" strokeWidth={2}>
                                    {pieData(item.data).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ==========================================
// VALUATION ANALYSIS
// ==========================================
export function ValuationAnalysis({ financials, comparables, technicalAnalysis, issuePrice, companyName }: any) {
    if (!financials || financials.length === 0) return null;

    const latestFinancial = financials[financials.length - 1];
    const companyPE = technicalAnalysis?.pe_ratio || (latestFinancial.eps ? issuePrice / latestFinancial.eps : null);
    const peerAvgPE = comparables?.length > 0 ? comparables.reduce((sum: number, peer: any) => sum + (peer.pe_ratio || 0), 0) / comparables.length : null;

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🎯 Valuation Analysis</h2>
            <div className={styles.valuationMetrics}>
                <div className={styles.metricCard}>
                    <span className={styles.metricIcon}>📊</span>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>P/E Ratio</span>
                        <span className={styles.metricValue}>{companyPE?.toFixed(2) || 'N/A'}</span>
                        {peerAvgPE && <span className={styles.metricCompare}>Industry Avg: {peerAvgPE.toFixed(2)} {companyPE && (companyPE < peerAvgPE ? '(Attractive)' : '(Premium)')}</span>}
                    </div>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricIcon}>💰</span>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Market Cap (Post-IPO)</span>
                        <span className={styles.metricValue}>₹{technicalAnalysis?.post_ipo_market_cap_cr?.toFixed(0) || 'N/A'} Cr</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ==========================================
// PEER COMPARISON
// ==========================================
export function PeerComparisonEnhanced({ comparables, currentIPO }: any) {
    if (!comparables || comparables.length === 0) return null;

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📊 Peer Comparison</h2>
            <div className={styles.tableContainer}>
                <table className={styles.comparisonTable}>
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Market Cap (₹Cr)</th>
                            <th>P/E Ratio</th>
                            <th>P/B Ratio</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className={styles.highlightRow}>
                            <td>{currentIPO.name} <span className={styles.currentBadge}>IPO</span></td>
                            <td>{currentIPO.marketCap?.toFixed(0) || 'N/A'}</td>
                            <td>{currentIPO.pe?.toFixed(2) || 'N/A'}</td>
                            <td>{currentIPO.pb?.toFixed(2) || 'N/A'}</td>
                        </tr>
                        {comparables.map((peer: any, index: number) => (
                            <tr key={index}>
                                <td>{peer.comparable_name}</td>
                                <td>{peer.market_cap_cr?.toFixed(0) || 'N/A'}</td>
                                <td>{peer.pe_ratio?.toFixed(2) || 'N/A'}</td>
                                <td>{peer.pb_ratio?.toFixed(2) || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// ==========================================
// ANCHOR INVESTORS
// ==========================================
export function AnchorInvestorsIntelligence({ anchorInvestors, companyName }: any) {
    if (!anchorInvestors || anchorInvestors.length === 0) return null;

    const totalInvestment = anchorInvestors.reduce((sum: number, inv: any) => sum + (inv.amount_invested_cr || 0), 0);

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🏦 Anchor Investors</h2>
            <div className={styles.anchorSummary}>
                <div className={styles.summaryCard}><span className={styles.summaryIcon}>👥</span><div className={styles.summaryContent}><span className={styles.summaryValue}>{anchorInvestors.length}</span><span className={styles.summaryLabel}>Total Anchors</span></div></div>
                <div className={styles.summaryCard}><span className={styles.summaryIcon}>💰</span><div className={styles.summaryContent}><span className={styles.summaryValue}>₹{totalInvestment.toFixed(0)} Cr</span><span className={styles.summaryLabel}>Total Investment</span></div></div>
            </div>
            <div className={styles.tableContainer}>
                <table className={styles.investorTable}>
                    <thead><tr><th>Investor Name</th><th>Type</th><th>Amount (₹Cr)</th></tr></thead>
                    <tbody>
                        {anchorInvestors.slice(0, 10).map((inv: any, index: number) => (
                            <tr key={index}><td>{inv.investor_name}</td><td>{inv.investor_type || 'N/A'}</td><td>₹{inv.amount_invested_cr?.toFixed(2) || 'N/A'}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// ==========================================
// DOCUMENT LIBRARY
// ==========================================
export function DocumentLibrary({ documents, companyName }: any) {
    if (!documents || documents.length === 0) return null;

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📚 Document Library</h2>
            <div className={styles.documentsGrid}>
                {documents.map((doc: any, index: number) => (
                    <a key={index} href={doc.document_url} target="_blank" rel="noopener noreferrer" className={styles.documentCard}>
                        <div className={styles.docIcon}>📄</div>
                        <div className={styles.docContent}><span className={styles.docTitle}>{doc.document_type}</span></div>
                        <div className={styles.docDownload}>↓</div>
                    </a>
                ))}
            </div>
        </section>
    );
}

// ==========================================
// INTERACTIVE FAQ
// ==========================================
export function InteractiveFAQ({ faqs, companyName }: any) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    if (!faqs || faqs.length === 0) return null;

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>❓ Frequently Asked Questions</h2>
            <div className={styles.faqList}>
                {faqs.map((faq: any, index: number) => (
                    <div key={index} className={styles.faqItem}>
                        <button className={`${styles.faqQuestion} ${expandedIndex === index ? styles.active : ''}`} onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                            <span>{faq.question}</span>
                            <span className={styles.faqToggle}>{expandedIndex === index ? '−' : '+'}</span>
                        </button>
                        {expandedIndex === index && <div className={styles.faqAnswer}>{faq.answer}</div>}
                    </div>
                ))}
            </div>
        </section>
    );
}

// ==========================================
// HOW TO APPLY GUIDE
// ==========================================
export function HowToApplyGuide({ companyName, lotSize, minInvestment }: any) {
    const steps = [
        { step: 1, title: 'Login to Broker', description: 'Open your trading app', icon: '🔐' },
        { step: 2, title: 'Find IPO Section', description: 'Navigate to ongoing IPOs', icon: '🔍' },
        { step: 3, title: 'Select IPO', description: `Choose ${companyName}`, icon: '✅' },
        { step: 4, title: 'Enter Bid', description: `Min ₹${minInvestment?.toLocaleString('en-IN') || 'N/A'}`, icon: '💰' },
        { step: 5, title: 'Submit & Authorize', description: 'Approve UPI mandate', icon: '✓' },
    ];

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📲 How to Apply</h2>
            <div className={styles.stepsContainer}>
                {steps.map((step) => (
                    <div key={step.step} className={styles.stepCard}>
                        <div className={styles.stepNumber}>{step.step}</div>
                        <div className={styles.stepIcon}>{step.icon}</div>
                        <div className={styles.stepContent}><h4 className={styles.stepTitle}>{step.title}</h4><p className={styles.stepDescription}>{step.description}</p></div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ==========================================
// KEY DATES CALENDAR
// ==========================================
export function KeyDatesCalendar({ dates, companyName }: any) {
    const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA';

    const keyDates = [
        { label: 'IPO Opening', date: dates?.open, icon: '🚀', color: COLORS.secondary },
        { label: 'IPO Closing', date: dates?.close, icon: '🏁', color: COLORS.accent },
        { label: 'Allotment', date: dates?.allotment, icon: '🎯', color: COLORS.warning },
        { label: 'Listing', date: dates?.listing, icon: '📈', color: COLORS.primary },
    ];

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📅 Key Dates</h2>
            <div className={styles.datesGrid}>
                {keyDates.map((item, index) => (
                    <div key={index} className={styles.dateCard} style={{ borderLeftColor: item.color }}>
                        <span className={styles.dateIcon}>{item.icon}</span>
                        <div className={styles.dateContent}><span className={styles.dateLabel}>{item.label}</span><span className={styles.dateValue}>{formatDate(item.date)}</span></div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ==========================================
// RELATED IPOS
// ==========================================
export function RelatedIPOs({ currentIPO, category, industry }: any) {
    const [relatedIPOs, setRelatedIPOs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRelated() {
            try {
                const { data, error } = await supabase
                    .from('ipos')
                    .select('id, ipo_name, company_name, slug, status, category, ipo_gmp(*)')
                    .neq('id', currentIPO?.id || 0)
                    .or(`category.eq.${category},industry_sector.eq.${industry}`)
                    .in('status', ['open', 'upcoming', 'closed'])
                    .limit(4);

                if (error) throw error;
                setRelatedIPOs(data || []);
            } catch (error) {
                console.error('Error fetching related IPOs:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchRelated();
    }, [currentIPO?.id, category, industry]);

    if (loading) return null;
    if (relatedIPOs.length === 0) return null;

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔗 Related IPOs</h2>
            <div className={styles.relatedGrid}>
                {relatedIPOs.map((ipo: any) => {
                    const latestGmp = ipo.ipo_gmp?.find((g: any) => g.is_latest) || ipo.ipo_gmp?.[0];
                    return (
                        <a key={ipo.id} href={`/ipo/${ipo.slug}`} className={styles.relatedCard}>
                            <div className={styles.relatedLogo}>{ipo.company_name?.charAt(0) || 'I'}</div>
                            <div className={styles.relatedContent}>
                                <h3 className={styles.relatedName}>{ipo.company_name || ipo.ipo_name}</h3>
                                <div className={styles.relatedMeta}>
                                    <span className={styles.relatedStatus}>{ipo.status}</span>
                                    <span className={styles.relatedCategory}>{ipo.category}</span>
                                </div>
                                {latestGmp && (
                                    <div className={`${styles.relatedGmp} ${latestGmp.gmp_amount >= 0 ? styles.positive : styles.negative}`}>
                                        GMP: ₹{latestGmp.gmp_amount}
                                    </div>
                                )}
                            </div>
                        </a>
                    );
                })}
            </div>
        </section>
    );
}

// ==========================================
// SOCIAL PROOF ELEMENTS
// ==========================================
// ==========================================
// SOCIAL PROOF ELEMENTS
// ==========================================
export function SocialProofElements({ ipoId, companyName }: any) {
    return null; // Monitoring/Tracking removed as per user request
}
// ==========================================
// BREADCRUMB NAVIGATION
// ==========================================
export function BreadcrumbNav({ companyName }: { companyName: string }) {
    return (
        <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
            <ol style={{ display: 'flex', gap: '0.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
                <li><a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>Home</a></li>
                <li>/</li>
                <li><a href="/ipos" style={{ color: '#3b82f6', textDecoration: 'none' }}>IPOs</a></li>
                <li>/</li>
                <li style={{ color: '#1a3a3a', fontWeight: 500 }}>{companyName} IPO</li>
            </ol>
        </nav>
    );
}


// ==========================================
// OBJECTS OF ISSUE ANALYSIS
// ==========================================
export function ObjectsOfIssueAnalysis({ objectives }: any) {
    // Mock Data Fallback
    const demoObjectives = [
        { objective_category: 'General Corporate Purposes', amount_allocated_cr: 150 },
        { objective_category: 'Debt Repayment', amount_allocated_cr: 100 },
        { objective_category: 'Capital Expenditure', amount_allocated_cr: 80 }
    ];
    // Use demo data if empty
    const dataToUse = (objectives && objectives.length > 0) ? objectives : demoObjectives;
    const isMock = (!objectives || objectives.length === 0);

    const COLORS_LIST = ['#1a3a3a', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Check if we have amounts, otherwise generic equal slices
    const hasAmounts = dataToUse.some((o: any) => o.amount_allocated_cr > 0);

    const chartData = dataToUse.map((obj: any, index: number) => ({
        name: obj.objective_category,
        value: hasAmounts ? (obj.amount_allocated_cr || 0) : 1,
        color: COLORS_LIST[index % COLORS_LIST.length]
    }));

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🎯 Objects of the Issue {isMock && <span style={{ fontSize: '0.7em', color: '#f59e0b' }}>(Projected Data)</span>}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => hasAmounts ? `₹${value} Cr` : ''} />
                            <Legend layout="vertical" align="right" verticalAlign="middle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className={styles.objectivesList}>
                    {dataToUse.map((obj: any, index: number) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ width: 12, height: 12, backgroundColor: COLORS_LIST[index % COLORS_LIST.length], borderRadius: '50%' }}></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: '#1a3a3a' }}>{obj.objective_category}</div>
                            </div>
                            {obj.amount_allocated_cr && (
                                <div style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>₹{obj.amount_allocated_cr} Cr</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ==========================================
// NEWSLETTER SIGNUP
// ==========================================
export function NewsletterSignup({ companyName, ipoId }: any) {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Try to save to newsletter_subscribers table if it exists
            const { error: dbError } = await supabase
                .from('newsletter_subscribers')
                .insert({
                    email,
                    ipo_id: ipoId,
                    ipo_name: companyName,
                    subscribed_at: new Date().toISOString()
                });

            if (dbError) {
                // If table doesn't exist, save to localStorage as fallback
                console.log('Newsletter table not found, saving locally');
                const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
                subscribers.push({ email, ipoId, companyName, subscribedAt: new Date().toISOString() });
                localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
            }

            setSubmitted(true);
        } catch (err) {
            console.error('Newsletter signup error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <section className={`${styles.section} ${styles.newsletterSection}`}>
                <div className={styles.successMessage}>
                    <span className={styles.successIcon}>✅</span>
                    <h3>You're All Set!</h3>
                    <p>We'll keep you updated on {companyName} IPO</p>
                </div>
            </section>
        );
    }

    return (
        <section className={`${styles.section} ${styles.newsletterSection}`}>
            <div className={styles.newsletterContent}>
                <div className={styles.newsletterLeft}>
                    <h2 className={styles.newsletterTitle}>📬 Get {companyName} IPO Alerts</h2>
                    <p className={styles.newsletterDesc}>Stay updated with real-time GMP changes, allotment status, and listing updates.</p>
                </div>
                <div className={styles.newsletterRight}>
                    <form className={styles.newsletterForm} onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <input
                                type="email"
                                className={styles.formInput}
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        {error && <p style={{ color: COLORS.danger, fontSize: '0.875rem' }}>{error}</p>}
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? '⏳ Subscribing...' : '🔔 Subscribe to Alerts'}
                        </button>
                        <p className={styles.privacyNote}>🔒 We respect your privacy. Unsubscribe anytime.</p>
                    </form>
                </div>
            </div>
        </section>
    );
}

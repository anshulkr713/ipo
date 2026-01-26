'use client';
import { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import styles from './IPODetail.module.css';

// Types
interface FinancialData {
    financial_year: string;
    revenue?: number;
    profit_after_tax?: number;
    ebitda?: number;
    eps?: number;
    net_worth?: number;
}

interface SubscriptionData {
    subscription_qib?: number;
    subscription_nii?: number;
    subscription_shni?: number;
    subscription_bhni?: number;
    subscription_retail?: number;
    subscription_total?: number;
    subscription_day?: number;
}

interface ShareholdingData {
    holding_type?: 'Pre-IPO' | 'Post-IPO';
    promoter_holding_percentage?: number;
    public_holding_percentage?: number;
}

interface ObjectiveData {
    objective_category: string;
    amount_allocated_cr?: number;
    percentage_of_total?: number;
}

interface ReviewData {
    reviewer_name: string;
    reviewer_type?: string;
    recommendation?: string;
    review_summary?: string;
    rating?: number;
}

interface FAQData {
    question: string;
    answer: string;
}

interface TimelineEvent {
    event_type: string;
    event_date: string;
    event_status?: 'Scheduled' | 'Completed' | 'Cancelled';
}

interface AnchorInvestor {
    investor_name: string;
    investor_type?: string;
    shares_allotted?: number;
    amount_invested_cr?: number;
}

interface ComparableData {
    comparable_name: string;
    comparable_ticker?: string;
    market_cap_cr?: number;
    pe_ratio?: number;
    pb_ratio?: number;
    revenue_cr?: number;
}

// Color palette
const COLORS = ['#1a3a3a', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

// ==========================================
// Subscription Chart Component
// ==========================================
export function SubscriptionChart({ data }: { data: SubscriptionData | null }) {
    if (!data) return <div className={styles.noData}>No subscription data available</div>;

    const chartData = [
        { name: 'QIB', value: data.subscription_qib || 0 },
        { name: 'sNII', value: data.subscription_shni || 0 },
        { name: 'bNII', value: data.subscription_bhni || 0 },
        { name: 'NII', value: data.subscription_nii || 0 },
        { name: 'Retail', value: data.subscription_retail || 0 },
    ].filter(item => item.value > 0);

    if (chartData.length === 0) return <div className={styles.noData}>No subscription data available</div>;

    return (
        <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#1a3a3a', fontSize: 12 }} width={60} />
                    <Tooltip
                        formatter={(value: number) => [`${value.toFixed(2)}x`, 'Subscription']}
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ==========================================
// Financials Table Component
// ==========================================
export function FinancialsTable({ data }: { data: FinancialData[] }) {
    if (!data || data.length === 0) return <div className={styles.noData}>No financial data available</div>;

    const formatCr = (val?: number) => val ? `₹${val.toLocaleString('en-IN')} Cr` : '-';
    const formatNum = (val?: number) => val ? val.toFixed(2) : '-';

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.financialsTable}>
                <thead>
                    <tr>
                        <th>Metric</th>
                        {data.map((d, i) => <th key={i}>{d.financial_year}</th>)}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Revenue</strong></td>
                        {data.map((d, i) => <td key={i}>{formatCr(d.revenue)}</td>)}
                    </tr>
                    <tr>
                        <td><strong>EBITDA</strong></td>
                        {data.map((d, i) => <td key={i}>{formatCr(d.ebitda)}</td>)}
                    </tr>
                    <tr>
                        <td><strong>PAT</strong></td>
                        {data.map((d, i) => <td key={i}>{formatCr(d.profit_after_tax)}</td>)}
                    </tr>
                    <tr>
                        <td><strong>EPS</strong></td>
                        {data.map((d, i) => <td key={i}>{formatNum(d.eps)}</td>)}
                    </tr>
                    <tr>
                        <td><strong>Net Worth</strong></td>
                        {data.map((d, i) => <td key={i}>{formatCr(d.net_worth)}</td>)}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

// ==========================================
// Shareholding Chart Component
// ==========================================
export function ShareholdingChart({ data }: { data: ShareholdingData[] }) {
    if (!data || data.length === 0) return <div className={styles.noData}>No shareholding data available</div>;

    const preIPO = data.find(d => d.holding_type === 'Pre-IPO');
    const postIPO = data.find(d => d.holding_type === 'Post-IPO');

    const createChartData = (d: ShareholdingData | undefined) => [
        { name: 'Promoter', value: d?.promoter_holding_percentage || 0 },
        { name: 'Public', value: d?.public_holding_percentage || 0 },
    ];

    return (
        <div className={styles.shareholdingContainer}>
            {preIPO && (
                <div className={styles.shareholdingChart}>
                    <h4>Pre-IPO</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={createChartData(preIPO)}
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {createChartData(preIPO).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
            {postIPO && (
                <div className={styles.shareholdingChart}>
                    <h4>Post-IPO</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={createChartData(postIPO)}
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {createChartData(postIPO).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

// ==========================================
// Objectives Chart Component
// ==========================================
export function ObjectivesChart({ data }: { data: ObjectiveData[] }) {
    if (!data || data.length === 0) return <div className={styles.noData}>No objectives data available</div>;

    const chartData = data.map(d => ({
        name: d.objective_category,
        value: d.amount_allocated_cr || d.percentage_of_total || 0,
    }));

    return (
        <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        dataKey="value"
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`₹${value} Cr`, '']} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// ==========================================
// Timeline Component
// ==========================================
export function TimelineVisual({ events, ipoData }: { events: TimelineEvent[]; ipoData: any }) {
    const allEvents = [
        { label: 'Open', date: ipoData.open_date, status: 'Completed' },
        { label: 'Close', date: ipoData.close_date, status: 'Completed' },
        { label: 'Allotment', date: ipoData.allotment_date, status: 'Scheduled' },
        { label: 'Refund', date: ipoData.refund_date, status: 'Scheduled' },
        { label: 'Credit', date: ipoData.demat_credit_date, status: 'Scheduled' },
        { label: 'Listing', date: ipoData.listing_date, status: 'Scheduled' },
    ].filter(e => e.date);

    const today = new Date();

    return (
        <div className={styles.timeline}>
            {allEvents.map((event, index) => {
                const eventDate = new Date(event.date);
                const isCompleted = eventDate <= today;
                const isCurrent = index > 0 &&
                    new Date(allEvents[index - 1]?.date) <= today &&
                    eventDate > today;

                return (
                    <div
                        key={index}
                        className={`${styles.timelineItem} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
                    >
                        <div className={styles.timelineDot}>
                            {isCompleted ? '✓' : index + 1}
                        </div>
                        <div className={styles.timelineContent}>
                            <span className={styles.timelineLabel}>{event.label}</span>
                            <span className={styles.timelineDate}>
                                {new Date(event.date).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short'
                                })}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ==========================================
// FAQ Accordion Component
// ==========================================
export function FAQAccordion({ faqs }: { faqs: FAQData[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    if (!faqs || faqs.length === 0) return <div className={styles.noData}>No FAQs available</div>;

    return (
        <div className={styles.faqContainer}>
            {faqs.map((faq, index) => (
                <div key={index} className={styles.faqItem}>
                    <button
                        className={`${styles.faqQuestion} ${openIndex === index ? styles.open : ''}`}
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    >
                        <span>{faq.question}</span>
                        <span className={styles.faqIcon}>{openIndex === index ? '−' : '+'}</span>
                    </button>
                    {openIndex === index && (
                        <div className={styles.faqAnswer}>
                            {faq.answer}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ==========================================
// Reviews Section Component
// ==========================================
export function ReviewsSection({ reviews }: { reviews: ReviewData[] }) {
    if (!reviews || reviews.length === 0) return <div className={styles.noData}>No reviews available</div>;

    const getRecommendationStyle = (rec?: string) => {
        if (!rec) return styles.neutral;
        if (rec.toLowerCase().includes('subscribe')) return styles.positive;
        if (rec.toLowerCase().includes('avoid')) return styles.negative;
        return styles.neutral;
    };

    return (
        <div className={styles.reviewsGrid}>
            {reviews.map((review, index) => (
                <div key={index} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                        <span className={styles.reviewerName}>{review.reviewer_name}</span>
                        {review.reviewer_type && (
                            <span className={styles.reviewerType}>{review.reviewer_type}</span>
                        )}
                    </div>
                    {review.recommendation && (
                        <div className={`${styles.recommendation} ${getRecommendationStyle(review.recommendation)}`}>
                            {review.recommendation}
                        </div>
                    )}
                    {review.review_summary && (
                        <p className={styles.reviewSummary}>{review.review_summary}</p>
                    )}
                    {review.rating && (
                        <div className={styles.rating}>
                            {'★'.repeat(Math.round(review.rating))}{'☆'.repeat(5 - Math.round(review.rating))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ==========================================
// Anchor Investors Table Component
// ==========================================
export function AnchorInvestorsTable({ investors }: { investors: AnchorInvestor[] }) {
    if (!investors || investors.length === 0) return <div className={styles.noData}>No anchor investor data available</div>;

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        <th>Investor Name</th>
                        <th>Type</th>
                        <th>Shares</th>
                        <th>Amount (Cr)</th>
                    </tr>
                </thead>
                <tbody>
                    {investors.slice(0, 10).map((inv, index) => (
                        <tr key={index}>
                            <td>{inv.investor_name}</td>
                            <td>{inv.investor_type || '-'}</td>
                            <td>{inv.shares_allotted?.toLocaleString('en-IN') || '-'}</td>
                            <td>{inv.amount_invested_cr ? `₹${inv.amount_invested_cr}` : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {investors.length > 10 && (
                <p className={styles.moreText}>+ {investors.length - 10} more investors</p>
            )}
        </div>
    );
}

// ==========================================
// Peer Comparison Table Component
// ==========================================
export function PeerComparisonTable({ comparables }: { comparables: ComparableData[] }) {
    if (!comparables || comparables.length === 0) return <div className={styles.noData}>No peer comparison data available</div>;

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        <th>Company</th>
                        <th>Ticker</th>
                        <th>Market Cap (Cr)</th>
                        <th>P/E</th>
                        <th>P/B</th>
                        <th>Revenue (Cr)</th>
                    </tr>
                </thead>
                <tbody>
                    {comparables.map((comp, index) => (
                        <tr key={index}>
                            <td>{comp.comparable_name}</td>
                            <td>{comp.comparable_ticker || '-'}</td>
                            <td>{comp.market_cap_cr ? `₹${comp.market_cap_cr.toLocaleString('en-IN')}` : '-'}</td>
                            <td>{comp.pe_ratio?.toFixed(2) || '-'}</td>
                            <td>{comp.pb_ratio?.toFixed(2) || '-'}</td>
                            <td>{comp.revenue_cr ? `₹${comp.revenue_cr.toLocaleString('en-IN')}` : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ==========================================
// KPI Cards Component
// ==========================================
interface KPIData {
    eps?: number;
    pe_ratio?: number;
    pb_ratio?: number;
    ronw?: number;
    debt_equity_ratio?: number;
    market_cap_cr?: number;
    promoter_holding?: number;
}

export function KPICards({ data }: { data: KPIData }) {
    const kpis = [
        { label: 'EPS', value: data.eps?.toFixed(2), suffix: '' },
        { label: 'P/E Ratio', value: data.pe_ratio?.toFixed(2), suffix: 'x' },
        { label: 'P/B Ratio', value: data.pb_ratio?.toFixed(2), suffix: 'x' },
        { label: 'RoNW', value: data.ronw?.toFixed(1), suffix: '%' },
        { label: 'Debt/Equity', value: data.debt_equity_ratio?.toFixed(2), suffix: '' },
        { label: 'Market Cap', value: data.market_cap_cr, suffix: ' Cr' },
    ].filter(k => k.value);

    if (kpis.length === 0) return null;

    return (
        <div className={styles.kpiGrid}>
            {kpis.map((kpi, index) => (
                <div key={index} className={styles.kpiCard}>
                    <span className={styles.kpiLabel}>{kpi.label}</span>
                    <span className={styles.kpiValue}>
                        {typeof kpi.value === 'number' ? `₹${kpi.value.toLocaleString('en-IN')}` : kpi.value}{kpi.suffix}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ==========================================
// Tab Navigation Component
// ==========================================
export function TabNavigation({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'financials', label: 'Financials' },
        { id: 'subscription', label: 'Subscription' },
        { id: 'reviews', label: 'Reviews' },
        { id: 'faqs', label: 'FAQs' },
    ];

    return (
        <nav className={styles.tabNav}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}

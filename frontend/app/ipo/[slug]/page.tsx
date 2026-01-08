'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import IPOSchema from './IPOSchema';

// Breadcrumb component for internal linking and SEO
const Breadcrumb = ({ companyName }: { companyName: string }) => (
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <ol itemScope itemType="https://schema.org/BreadcrumbList" style={{ display: 'flex', gap: '0.5rem', listStyle: 'none', margin: 0, padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--neutral-200)' }}>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link href="/" itemProp="item" style={{ color: 'var(--accent-cyan)' }}><span itemProp="name">Home</span></Link>
                <meta itemProp="position" content="1" />
            </li>
            <li style={{ color: 'var(--neutral-200)' }}>/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link href="/upcoming-ipos" itemProp="item" style={{ color: 'var(--accent-cyan)' }}><span itemProp="name">IPOs</span></Link>
                <meta itemProp="position" content="2" />
            </li>
            <li style={{ color: 'var(--neutral-200)' }}>/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <span itemProp="name">{companyName} IPO</span>
                <meta itemProp="position" content="3" />
            </li>
        </ol>
    </nav>
);

// Mock IPO data - will be replaced with API call
const mockIPOData = {
    id: 1,
    slug: 'tata-technologies-ipo-gmp-allotment-subscription',
    companyName: 'Tata Technologies',
    logo: 'TT',
    status: 'Open for Subscription' as const,
    category: 'Mainboard',

    // Hero Metrics
    gmp: 485,
    gmpPercentage: 96.5,
    subscription: 69.43,
    priceMin: 475,
    priceMax: 500,
    lotSize: 30,

    // Quick Facts
    issueType: 'Mainboard',
    issueSize: 3042.51,
    freshIssue: 0,
    ofs: 3042.51,
    minInvestment: 15000,
    openDate: '2024-11-22',
    closeDate: '2024-11-24',
    allotmentDate: '2024-11-29',
    listingDate: '2024-11-30',
    registrar: 'Link Intime India Pvt Ltd',
    registrarLink: 'https://linkintime.co.in',
    leadManagers: ['JM Financial', 'Citigroup', 'BofA Securities'],
    exchanges: ['NSE', 'BSE'],

    // Subscription Details
    subscriptionData: {
        overall: 69.43,
        qib: 200.56,
        nii: 45.23,
        bNII: 38.45,
        sNII: 52.18,
        retail: 12.87,
        employee: 8.45,
        shareholder: 15.23,
    },
    lastUpdated: '2024-11-24T16:30:00',

    // GMP History
    gmpHistory: [
        { date: '2024-11-24', gmp: 485, change: '+25', premium: 96.5 },
        { date: '2024-11-23', gmp: 460, change: '+40', premium: 92.0 },
        { date: '2024-11-22', gmp: 420, change: '+35', premium: 84.0 },
        { date: '2024-11-21', gmp: 385, change: '+20', premium: 77.0 },
        { date: '2024-11-20', gmp: 365, change: '+15', premium: 73.0 },
    ],
    kostakRate: 25000,
    subjectToSauda: 22000,

    // Financials
    financials: {
        revenueFY23: 4414.87,
        revenueFY22: 3530.42,
        revenueFY21: 2485.24,
        patFY23: 624.31,
        patFY22: 438.26,
        patFY21: 169.52,
        netWorth: 2586.43,
        eps: 15.42,
        peRatio: 32.4,
        ronw: 24.1,
        debtToEquity: 0.02,
    },

    // Issue Details
    issueBreakup: {
        freshIssue: 0,
        freshIssuePercent: 0,
        ofs: 3042.51,
        ofsPercent: 100,
        preIpoPlacement: 0,
        totalIssue: 3042.51,
        postIssuePaidUp: 405.18,
        marketCap: 20259,
    },
    useOfFunds: [
        { label: 'General Corporate Purposes', percentage: 100, color: '#2563eb' },
    ],

    // Shareholding
    preIpoShareholding: [
        { label: 'Promoters', percentage: 74.39, color: '#2563eb' },
        { label: 'Public', percentage: 25.61, color: '#06b6d4' },
    ],
    postIpoShareholding: [
        { label: 'Promoters', percentage: 59.15, color: '#2563eb' },
        { label: 'QIB', percentage: 18.42, color: '#10b981' },
        { label: 'NII', percentage: 7.37, color: '#f59e0b' },
        { label: 'Retail', percentage: 9.82, color: '#ef4444' },
        { label: 'Others', percentage: 5.24, color: '#8b5cf6' },
    ],
    promoters: [
        { name: 'Tata Motors Ltd', relationship: 'Holding Company', preIpo: 74.39, postIpo: 59.15 },
    ],
    lockInPeriod: { promoter: 18, preIpo: 6 },

    // Company Info
    about: {
        overview: `Tata Technologies is a global engineering and product development digital services company. The company provides services to automotive and aerospace manufacturers worldwide. With over 11,000 employees across 21 countries, they help clients design, develop, and realize better products.`,
        highlights: [
            'Global leader in engineering and design services',
            'Serving top automotive and aerospace OEMs',
            'Strong presence in EV and sustainable mobility',
            'Robust R&D capabilities with 8 global delivery centers',
            'Part of the Tata Group with strong parentage',
            'High client retention rate of 95%+',
        ],
        industry: 'Engineering Research & Development Services',
        marketSize: 'USD 215 billion globally',
    },

    // Expert Review
    review: {
        overall: 4.2,
        ratings: {
            financial: 4.5,
            valuation: 3.8,
            growth: 4.5,
            management: 4.2,
            industry: 4.0,
        },
        strengths: [
            'Strong parentage with Tata Group brand value',
            'Diversified global client base across geographies',
            'Leadership position in ER&D services segment',
        ],
        concerns: [
            'Premium valuation compared to listed peers',
            'High dependence on automotive sector',
            'Forex exposure due to global operations',
        ],
        recommendation: 'Subscribe for Long-term',
        riskLevel: 'Medium',
        investmentHorizon: 'Long-term (2-3 years)',
    },
    poll: { yes: 78, no: 22, totalVotes: 12543 },

    // Timeline
    timeline: [
        { label: 'IPO Announcement', date: '2024-11-15', status: 'completed' },
        { label: 'Price Band', date: '2024-11-18', status: 'completed' },
        { label: 'IPO Opens', date: '2024-11-22', status: 'active' },
        { label: 'IPO Closes', date: '2024-11-24', status: 'upcoming' },
        { label: 'Allotment', date: '2024-11-29', status: 'upcoming' },
        { label: 'Refunds', date: '2024-11-30', status: 'upcoming' },
        { label: 'Credit to Demat', date: '2024-11-30', status: 'upcoming' },
        { label: 'Listing', date: '2024-12-01', status: 'upcoming' },
    ],

    // FAQs
    faqs: [
        { q: 'What is the Tata Technologies IPO price band?', a: 'The price band for Tata Technologies IPO is ₹475 to ₹500 per share. At the upper price band, the minimum investment required is ₹15,000 for 1 lot (30 shares).' },
        { q: 'When does Tata Technologies IPO open and close?', a: 'Tata Technologies IPO opens on November 22, 2024 and closes on November 24, 2024. The IPO is open for subscription for 3 days.' },
        { q: 'What is the current GMP for Tata Technologies IPO?', a: 'The current Grey Market Premium (GMP) for Tata Technologies IPO is ₹485, indicating an expected listing gain of approximately 97% over the issue price.' },
        { q: 'How to check Tata Technologies IPO allotment status?', a: 'You can check the allotment status on the registrar website (Link Intime) or on BSE/NSE websites using your PAN number or application number after the allotment date.' },
        { q: 'What is the lot size for Tata Technologies IPO?', a: 'The lot size is 30 shares. Retail investors can apply for minimum 1 lot (₹15,000) and maximum 13 lots (₹1,95,000).' },
    ],

    // Related IPOs
    relatedIPOs: [
        { id: 2, name: 'Fedbank Financial', priceRange: '₹133-140', gmp: 25, subscription: 2.43, logo: 'FF' },
        { id: 3, name: 'Gandhar Oil', priceRange: '₹160-169', gmp: 45, subscription: 8.76, logo: 'GO' },
        { id: 4, name: 'Flair Writing', priceRange: '₹288-304', gmp: 65, subscription: 15.23, logo: 'FW' },
    ],

    // Comments
    comments: [
        { id: 1, author: 'Rahul Sharma', date: '2024-11-24', body: 'Great IPO, definitely applying for long term. Tata brand gives confidence.' },
        { id: 2, author: 'Priya Patel', date: '2024-11-23', body: 'GMP is very high, might see some correction post listing. Careful with expectations.' },
        { id: 3, author: 'Amit Kumar', date: '2024-11-22', body: 'Applied from 3 accounts. High hopes for allotment!' },
    ],
};

type IPOStatus = 'Open for Subscription' | 'Closed' | 'Allotment Done' | 'Listed';

const getStatusClass = (status: IPOStatus) => {
    switch (status) {
        case 'Open for Subscription': return styles.statusOpen;
        case 'Closed': return styles.statusClosed;
        case 'Allotment Done': return styles.statusAllotment;
        case 'Listed': return styles.statusListed;
        default: return '';
    }
};

const getProgressColor = (value: number) => {
    if (value < 1) return styles.progressRed;
    if (value < 5) return styles.progressOrange;
    if (value < 10) return styles.progressYellow;
    return styles.progressGreen;
};

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export default function IPODetailPage() {
    const params = useParams();
    const [ipo, setIpo] = useState(mockIPOData);
    const [openFaqs, setOpenFaqs] = useState<number[]>([]);
    const [showStickyFooter, setShowStickyFooter] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowStickyFooter(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleFaq = (index: number) => {
        setOpenFaqs(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    };

    return (
        <div className={styles.pageWrapper}>
            {/* JSON-LD Schema Markup for SEO */}
            <IPOSchema
                companyName={ipo.companyName}
                gmp={ipo.gmp}
                gmpPercentage={ipo.gmpPercentage}
                subscription={ipo.subscription}
                priceMin={ipo.priceMin}
                priceMax={ipo.priceMax}
                openDate={ipo.openDate}
                closeDate={ipo.closeDate}
                allotmentDate={ipo.allotmentDate}
                listingDate={ipo.listingDate}
                registrar={ipo.registrar}
                registrarLink={ipo.registrarLink}
                faqs={ipo.faqs}
                slug={ipo.slug}
            />

            <div className={styles.container}>
                {/* Breadcrumb Navigation */}
                <Breadcrumb companyName={ipo.companyName} />

                {/* SECTION A: Hero */}
                <section className={styles.hero} aria-labelledby="hero-title">
                    <div className={styles.heroHeader}>
                        <div className={styles.heroLeft}>
                            <div className={styles.companyLogo} role="img" aria-label={`${ipo.companyName} logo`}>{ipo.logo}</div>
                            <div>
                                <h1 id="hero-title" className={styles.heroTitle}>{ipo.companyName} IPO - GMP, Subscription, Allotment Status, Review</h1>
                                <span className={`${styles.statusBadge} ${getStatusClass(ipo.status)}`} role="status" aria-live="polite">
                                    ● {ipo.status}
                                </span>
                                <p className={styles.lastUpdated}>Last updated: <time dateTime={ipo.lastUpdated}>{formatDate(ipo.lastUpdated)}</time></p>
                            </div>
                        </div>
                        <button className={styles.alertButton} aria-label={`Set price alert for ${ipo.companyName} IPO`}>🔔 Set Alert</button>
                    </div>

                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Grey Market Premium</div>
                            <div className={styles.metricValue}>{formatCurrency(ipo.gmp)}</div>
                            <div className={`${styles.metricChange} ${styles.positive}`}>+{ipo.gmpPercentage}%</div>
                        </div>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Subscription</div>
                            <div className={styles.metricValue}>{ipo.subscription}x</div>
                            <div className={`${styles.metricChange} ${styles.positive}`}>times</div>
                        </div>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Price Band</div>
                            <div className={styles.metricValue}>{formatCurrency(ipo.priceMin)} - {formatCurrency(ipo.priceMax)}</div>
                        </div>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Lot Size</div>
                            <div className={styles.metricValue}>{ipo.lotSize} shares</div>
                            <div className={styles.metricChange}>{formatCurrency(ipo.lotSize * ipo.priceMax)}</div>
                        </div>
                    </div>
                </section>

                {/* SECTION B: Quick Facts */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>📋</span> Quick Facts</h2>
                    <div className={styles.factsGrid}>
                        <div className={styles.factItem}><span className={styles.factLabel}>📊 Issue Type</span><span className={styles.factValue}>{ipo.issueType}</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>📅 IPO Open Date</span><span className={styles.factValue}>{formatDate(ipo.openDate)}</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>💰 Issue Size</span><span className={styles.factValue}>{formatCurrency(ipo.issueSize)} Cr</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>📅 IPO Close Date</span><span className={styles.factValue}>{formatDate(ipo.closeDate)}</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>🆕 Fresh Issue</span><span className={styles.factValue}>{formatCurrency(ipo.freshIssue)} Cr</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>📅 Allotment Date</span><span className={styles.factValue}>{formatDate(ipo.allotmentDate)}</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>🔄 OFS</span><span className={styles.factValue}>{formatCurrency(ipo.ofs)} Cr</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>📅 Listing Date</span><span className={styles.factValue}>{formatDate(ipo.listingDate)}</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>💵 Price Band</span><span className={styles.factValue}>{formatCurrency(ipo.priceMin)} - {formatCurrency(ipo.priceMax)}</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>📝 Registrar</span><span className={styles.factValue}>{ipo.registrar}</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>📦 Lot Size</span><span className={styles.factValue}>{ipo.lotSize} shares</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>🏢 Lead Managers</span><span className={styles.factValue}>{ipo.leadManagers.length} managers</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>💸 Min Investment</span><span className={styles.factValue}>{formatCurrency(ipo.minInvestment)}</span></div>
                        <div className={styles.factItem}><span className={styles.factLabel}>📈 Exchange</span><span className={styles.factValue}>{ipo.exchanges.join(', ')}</span></div>
                    </div>
                </section>

                {/* SECTION C: Subscription Status */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>📊</span> Live Subscription Status</h2>
                    <div className={styles.subscriptionOverall}>
                        <div className={styles.overallLabel}>Overall Subscription</div>
                        <div className={styles.overallValue}>{ipo.subscriptionData.overall}x</div>
                        <div className={`${styles.overallTrend} ${styles.positive}`}>▲ times subscribed</div>
                    </div>

                    <div className={styles.categoryCards}>
                        {[
                            { name: 'QIB', value: ipo.subscriptionData.qib },
                            { name: 'NII (bNII)', value: ipo.subscriptionData.bNII },
                            { name: 'NII (sNII)', value: ipo.subscriptionData.sNII },
                            { name: 'Retail (RII)', value: ipo.subscriptionData.retail },
                            { name: 'Employee', value: ipo.subscriptionData.employee },
                        ].map((cat) => (
                            <div key={cat.name} className={styles.categoryCard}>
                                <div className={styles.categoryName}>{cat.name}</div>
                                <div className={styles.categoryValue}>{cat.value}x</div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={`${styles.progressFill} ${getProgressColor(cat.value)}`}
                                        style={{ width: `${Math.min(cat.value * 10, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.refreshRow}>
                        <span className={styles.timestamp}>Updated: {formatDate(ipo.lastUpdated)}</span>
                        <button className={styles.refreshButton}>🔄 Refresh Now</button>
                    </div>
                </section>

                {/* SECTION D: GMP Tracker */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>💹</span> Grey Market Premium (GMP) Analysis</h2>
                    <div className={styles.gmpGrid}>
                        <div className={styles.gmpMainCard}>
                            <div className={styles.gmpAmount}>{formatCurrency(ipo.gmp)}</div>
                            <div className={styles.gmpRow}><span className={styles.gmpLabel}>GMP Premium</span><span className={`${styles.gmpValue} ${styles.positive}`}>+{ipo.gmpPercentage}%</span></div>
                            <div className={styles.gmpRow}><span className={styles.gmpLabel}>Expected Listing</span><span className={styles.gmpValue}>{formatCurrency(ipo.priceMax + ipo.gmp)}</span></div>
                            <div className={styles.gmpRow}><span className={styles.gmpLabel}>Est. Listing Gain</span><span className={`${styles.gmpValue} ${styles.positive}`}>{formatCurrency(ipo.gmp * ipo.lotSize)}</span></div>
                            <div className={styles.gmpRow}><span className={styles.gmpLabel}>Kostak Rate</span><span className={styles.gmpValue}>{formatCurrency(ipo.kostakRate)}</span></div>
                            <div className={styles.gmpRow}><span className={styles.gmpLabel}>Subject to Sauda</span><span className={styles.gmpValue}>{formatCurrency(ipo.subjectToSauda)}</span></div>
                        </div>

                        <div className={styles.gmpChart}>
                            <div className={styles.chartTitle}>GMP Trend (Last 5 Days)</div>
                            <div className={styles.chartArea}>
                                {ipo.gmpHistory.slice().reverse().map((day, i) => (
                                    <div key={i} className={styles.chartBar} style={{ height: `${(day.gmp / 500) * 100}%` }} title={`${day.date}: ₹${day.gmp}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.gmpHistoryTable}>
                        <table className={styles.historyTable}>
                            <thead>
                                <tr><th>Date</th><th>GMP (₹)</th><th>Change</th><th>Premium (%)</th></tr>
                            </thead>
                            <tbody>
                                {ipo.gmpHistory.map((day, i) => (
                                    <tr key={i}>
                                        <td>{formatDate(day.date)}</td>
                                        <td>{formatCurrency(day.gmp)}</td>
                                        <td className={styles.positive}>{day.change}</td>
                                        <td>{day.premium}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.disclaimer}>⚠️ GMP Disclaimer: Grey market premiums are unofficial and may not reflect actual listing performance. Invest based on fundamentals.</div>
                </section>

                {/* SECTION E: Allotment Details */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>🎯</span> IPO Allotment Status & Details</h2>
                    <div className={styles.allotmentGrid}>
                        <div className={styles.allotmentCard}>
                            <h3>Allotment Status</h3>
                            <p style={{ marginBottom: '1rem', color: 'var(--neutral-200)' }}>Expected on: {formatDate(ipo.allotmentDate)}</p>
                            <a href={ipo.registrarLink} target="_blank" rel="noopener noreferrer" className={styles.registrarLink}>
                                🔗 Check on {ipo.registrar}
                            </a>
                        </div>
                        <div className={styles.allotmentCard}>
                            <h3>Refund Information</h3>
                            <p style={{ color: 'var(--neutral-200)', marginBottom: '0.5rem' }}>Refund Date: {formatDate(ipo.timeline.find(t => t.label === 'Refunds')?.date || '')}</p>
                            <p style={{ color: 'var(--neutral-200)' }}>Credit to Demat: {formatDate(ipo.listingDate)}</p>
                        </div>
                    </div>
                </section>

                {/* SECTION F: Financials */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>💰</span> Company Financial Performance</h2>
                    <div className={styles.financialCards}>
                        {[
                            { label: 'Revenue (FY23)', value: `₹${ipo.financials.revenueFY23} Cr` },
                            { label: 'PAT (FY23)', value: `₹${ipo.financials.patFY23} Cr` },
                            { label: 'Net Worth', value: `₹${ipo.financials.netWorth} Cr` },
                            { label: 'EPS', value: `₹${ipo.financials.eps}` },
                            { label: 'P/E Ratio', value: `${ipo.financials.peRatio}x` },
                            { label: 'RoNW', value: `${ipo.financials.ronw}%` },
                            { label: 'Debt/Equity', value: `${ipo.financials.debtToEquity}` },
                        ].map((metric) => (
                            <div key={metric.label} className={styles.financialCard}>
                                <div className={styles.financialLabel}>{metric.label}</div>
                                <div className={styles.financialValue}>{metric.value}</div>
                            </div>
                        ))}
                    </div>

                    <table className={styles.financialTable}>
                        <thead><tr><th>Particulars</th><th>FY23</th><th>FY22</th><th>FY21</th><th>Growth</th></tr></thead>
                        <tbody>
                            <tr><td>Revenue (₹ Cr)</td><td>{ipo.financials.revenueFY23}</td><td>{ipo.financials.revenueFY22}</td><td>{ipo.financials.revenueFY21}</td><td className={styles.positive}>+25%</td></tr>
                            <tr><td>PAT (₹ Cr)</td><td>{ipo.financials.patFY23}</td><td>{ipo.financials.patFY22}</td><td>{ipo.financials.patFY21}</td><td className={styles.positive}>+42%</td></tr>
                        </tbody>
                    </table>
                </section>

                {/* SECTION G: Issue Details */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>📄</span> IPO Details</h2>
                    <div className={styles.issueGrid}>
                        <div className={styles.issueBreakup}>
                            <h3>Issue Breakup</h3>
                            {[
                                { label: 'Fresh Issue', value: `₹${ipo.issueBreakup.freshIssue} Cr (${ipo.issueBreakup.freshIssuePercent}%)` },
                                { label: 'Offer for Sale', value: `₹${ipo.issueBreakup.ofs} Cr (${ipo.issueBreakup.ofsPercent}%)` },
                                { label: 'Total Issue Size', value: `₹${ipo.issueBreakup.totalIssue} Cr` },
                                { label: 'Market Cap (Upper)', value: `₹${ipo.issueBreakup.marketCap} Cr` },
                            ].map((item) => (
                                <div key={item.label} className={styles.breakupItem}>
                                    <span className={styles.breakupLabel}>{item.label}</span>
                                    <span className={styles.breakupValue}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.useFunds}>
                            <h3>Use of Funds</h3>
                            <div className={styles.pieChart} style={{ background: `conic-gradient(${ipo.useOfFunds.map((f, i) => `${f.color} ${i === 0 ? 0 : ipo.useOfFunds.slice(0, i).reduce((a, b) => a + b.percentage, 0)}% ${ipo.useOfFunds.slice(0, i + 1).reduce((a, b) => a + b.percentage, 0)}%`).join(', ')})` }} />
                            <div className={styles.pieLegend}>
                                {ipo.useOfFunds.map((fund) => (
                                    <div key={fund.label} className={styles.legendItem}>
                                        <span className={styles.legendColor} style={{ background: fund.color }} />
                                        <span>{fund.label}: {fund.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION H: Shareholding */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>🏛️</span> Shareholding Pattern</h2>
                    <div className={styles.shareholdingGrid}>
                        <div className={styles.shareholdingCard}>
                            <h3>Pre-IPO Shareholding</h3>
                            <div className={styles.pieChart} style={{ background: `conic-gradient(${ipo.preIpoShareholding.map((s, i) => `${s.color} ${i === 0 ? 0 : ipo.preIpoShareholding.slice(0, i).reduce((a, b) => a + b.percentage, 0)}% ${ipo.preIpoShareholding.slice(0, i + 1).reduce((a, b) => a + b.percentage, 0)}%`).join(', ')})` }} />
                            <div className={styles.pieLegend}>
                                {ipo.preIpoShareholding.map((s) => (
                                    <div key={s.label} className={styles.legendItem}><span className={styles.legendColor} style={{ background: s.color }} /><span>{s.label}: {s.percentage}%</span></div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.shareholdingCard}>
                            <h3>Post-IPO Shareholding</h3>
                            <div className={styles.pieChart} style={{ background: `conic-gradient(${ipo.postIpoShareholding.map((s, i) => `${s.color} ${i === 0 ? 0 : ipo.postIpoShareholding.slice(0, i).reduce((a, b) => a + b.percentage, 0)}% ${ipo.postIpoShareholding.slice(0, i + 1).reduce((a, b) => a + b.percentage, 0)}%`).join(', ')})` }} />
                            <div className={styles.pieLegend}>
                                {ipo.postIpoShareholding.map((s) => (
                                    <div key={s.label} className={styles.legendItem}><span className={styles.legendColor} style={{ background: s.color }} /><span>{s.label}: {s.percentage}%</span></div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <table className={styles.promoterTable}>
                        <thead><tr><th>Promoter Name</th><th>Relationship</th><th>Pre-IPO (%)</th><th>Post-IPO (%)</th></tr></thead>
                        <tbody>
                            {ipo.promoters.map((p, i) => (
                                <tr key={i}><td>{p.name}</td><td>{p.relationship}</td><td>{p.preIpo}%</td><td>{p.postIpo}%</td></tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* SECTION I: About Company */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>🏢</span> About {ipo.companyName}</h2>
                    <div className={styles.companyOverview}><p>{ipo.about.overview}</p></div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--neutral-100)' }}>Key Highlights</h3>
                    <div className={styles.highlights}>
                        {ipo.about.highlights.map((h, i) => (
                            <div key={i} className={styles.highlightItem}><span className={styles.highlightIcon}>✓</span><span className={styles.highlightText}>{h}</span></div>
                        ))}
                    </div>
                </section>

                {/* SECTION J: Expert Review */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>⭐</span> IPO Review & Recommendation</h2>
                    <div className={styles.reviewHeader}>
                        <div className={styles.overallRating}>
                            <div className={styles.ratingStars}>{'★'.repeat(Math.floor(ipo.review.overall))}{'☆'.repeat(5 - Math.floor(ipo.review.overall))}</div>
                            <div className={styles.ratingLabel}>{ipo.review.overall} out of 5</div>
                        </div>
                        <div className={styles.ratingBars}>
                            {Object.entries(ipo.review.ratings).map(([key, value]) => (
                                <div key={key} className={styles.ratingItem}>
                                    <span className={styles.ratingName}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                    <div className={styles.ratingBar}><div className={styles.ratingFill} style={{ width: `${value * 20}%` }} /></div>
                                    <span className={styles.ratingValue}>{value}/5</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.prosConsGrid}>
                        <div className={styles.prosSection}>
                            <h3>✓ Strengths</h3>
                            <ul className={styles.prosList}>{ipo.review.strengths.map((s, i) => <li key={i}><span>✓</span> {s}</li>)}</ul>
                        </div>
                        <div className={styles.consSection}>
                            <h3>⚠ Concerns</h3>
                            <ul className={styles.consList}>{ipo.review.concerns.map((c, i) => <li key={i}><span>⚠</span> {c}</li>)}</ul>
                        </div>
                    </div>

                    <div className={styles.recommendationBox}>
                        <div className={styles.recommendationLabel}>Expert Recommendation</div>
                        <div className={styles.recommendationValue}>{ipo.review.recommendation}</div>
                        <p style={{ color: 'var(--neutral-200)', fontSize: '0.875rem' }}>Risk Level: {ipo.review.riskLevel} | Horizon: {ipo.review.investmentHorizon}</p>
                        <div className={styles.poll}>
                            <div className={styles.pollOption}>
                                <div className={styles.pollPercent}>{ipo.poll.yes}%</div>
                                <div className={styles.pollBar}><div className={`${styles.pollFill} ${styles.pollYes}`} style={{ width: `${ipo.poll.yes}%` }} /></div>
                                <div className={styles.pollLabel}>Should Apply</div>
                            </div>
                            <div className={styles.pollOption}>
                                <div className={styles.pollPercent}>{ipo.poll.no}%</div>
                                <div className={styles.pollBar}><div className={`${styles.pollFill} ${styles.pollNo}`} style={{ width: `${ipo.poll.no}%` }} /></div>
                                <div className={styles.pollLabel}>Should Skip</div>
                            </div>
                        </div>
                        <p style={{ marginTop: '1rem', color: 'var(--neutral-200)', fontSize: '0.75rem' }}>{ipo.poll.totalVotes.toLocaleString()} investors voted</p>
                    </div>
                </section>

                {/* SECTION K: Timeline */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>📅</span> IPO Timeline & Important Dates</h2>
                    <div className={styles.timeline}>
                        <div className={styles.timelineTrack}><div className={styles.timelineProgress} style={{ width: '37.5%' }} /></div>
                        <div className={styles.timelineItems}>
                            {ipo.timeline.map((item, i) => (
                                <div key={i} className={styles.timelineItem}>
                                    <div className={`${styles.timelineDot} ${item.status === 'completed' ? styles.completed : item.status === 'active' ? styles.active : ''}`} />
                                    <div><div className={styles.timelineLabel}>{item.label}</div><div className={styles.timelineDate}>{formatDate(item.date)}</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.countdown}>
                        <div className={styles.countdownLabel}>Time to IPO Close</div>
                        <div className={styles.countdownValue}>2 Days 8 Hours 30 Minutes</div>
                    </div>
                </section>

                {/* SECTION L: Registrar */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>🏛️</span> Registrar & Lead Managers</h2>
                    <div className={styles.registrarGrid}>
                        <div className={styles.registrarCard}>
                            <h3>Registrar</h3>
                            <div className={styles.registrarInfo}>
                                <p><strong>{ipo.registrar}</strong></p>
                                <p>Website: <a href={ipo.registrarLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>{ipo.registrarLink}</a></p>
                            </div>
                            <a href={ipo.registrarLink} target="_blank" rel="noopener noreferrer" className={styles.registrarLink} style={{ marginTop: '1rem', display: 'inline-flex' }}>Check Allotment Status</a>
                        </div>
                        <div className={styles.registrarCard}>
                            <h3>Book Running Lead Managers</h3>
                            <div className={styles.leadManagers}>
                                {ipo.leadManagers.map((m, i) => <span key={i} className={styles.managerBadge}>{m}</span>)}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION M: How to Apply */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>📝</span> How to Apply for {ipo.companyName} IPO</h2>
                    <div className={styles.stepsGrid}>
                        {[
                            { num: 1, title: 'Log in to your Demat Account', desc: 'Access your trading/demat account through your broker app or website.' },
                            { num: 2, title: 'Navigate to IPO Section', desc: 'Find the IPO or New Issues section in your trading platform.' },
                            { num: 3, title: `Select ${ipo.companyName} IPO`, desc: 'Click on the IPO to view details and apply.' },
                            { num: 4, title: 'Choose Number of Lots', desc: `Min: 1 lot (${ipo.lotSize} shares = ${formatCurrency(ipo.minInvestment)})` },
                            { num: 5, title: 'Select UPI ID or ASBA', desc: 'Enter your UPI ID for payment or select ASBA through your bank.' },
                            { num: 6, title: 'Submit Application', desc: 'Review details and submit your application.' },
                            { num: 7, title: 'Approve UPI Request', desc: 'Accept the mandate request in your UPI app within 24 hours.' },
                        ].map((step) => (
                            <div key={step.num} className={styles.step}>
                                <div className={styles.stepNumber}>{step.num}</div>
                                <div className={styles.stepContent}><h4>{step.title}</h4><p>{step.desc}</p>
                                    {step.num === 1 && (
                                        <div className={styles.brokerLinks}>
                                            {['Zerodha', 'Upstox', 'Groww', 'Angel One', 'ICICI Direct'].map((b) => <span key={b} className={styles.brokerLink}>{b}</span>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION N: FAQs */}
                <section className={styles.section} aria-labelledby="faq-heading">
                    <h2 id="faq-heading" className={styles.sectionTitle}><span className={styles.sectionIcon}>❓</span> Frequently Asked Questions</h2>
                    <div className={styles.faqList} role="region" aria-label="FAQ accordion">
                        {ipo.faqs.map((faq, i) => (
                            <div key={i} className={`${styles.faqItem} ${openFaqs.includes(i) ? styles.open : ''}`}>
                                <button
                                    className={styles.faqQuestion}
                                    onClick={() => toggleFaq(i)}
                                    aria-expanded={openFaqs.includes(i)}
                                    aria-controls={`faq-answer-${i}`}
                                    id={`faq-question-${i}`}
                                >
                                    {faq.q}
                                    <span className={styles.faqIcon} aria-hidden="true">+</span>
                                </button>
                                <div
                                    className={styles.faqAnswer}
                                    id={`faq-answer-${i}`}
                                    role="region"
                                    aria-labelledby={`faq-question-${i}`}
                                    hidden={!openFaqs.includes(i)}
                                >
                                    <div className={styles.faqAnswerContent}>{faq.a}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION O: Related IPOs */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>📈</span> Similar IPOs You Might Be Interested In</h2>
                    <div className={styles.relatedScroll}>
                        {ipo.relatedIPOs.map((related) => (
                            <div key={related.id} className={styles.relatedCard}>
                                <div className={styles.relatedHeader}>
                                    <div className={styles.relatedLogo}>{related.logo}</div>
                                    <div className={styles.relatedName}>{related.name}</div>
                                </div>
                                <div className={styles.relatedMeta}>
                                    <div className={styles.relatedRow}><span className={styles.relatedLabel}>Price</span><span className={styles.relatedValue}>{related.priceRange}</span></div>
                                    <div className={styles.relatedRow}><span className={styles.relatedLabel}>GMP</span><span className={`${styles.relatedValue} ${styles.positive}`}>₹{related.gmp}</span></div>
                                    <div className={styles.relatedRow}><span className={styles.relatedLabel}>Subscription</span><span className={styles.relatedValue}>{related.subscription}x</span></div>
                                </div>
                                <Link href={`/ipo/${related.name.toLowerCase().replace(/\s+/g, '-')}-ipo-gmp-allotment-subscription`}><button className={styles.viewButton}>View Details</button></Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION P: Comments */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>💬</span> Investor Discussion & Comments</h2>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--neutral-200)' }}>{ipo.comments.length} investors have shared their views</p>

                    <div className={styles.commentForm}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Name</label><input type="text" placeholder="Your name" /></div>
                            <div className={styles.formGroup}><label>Email</label><input type="email" placeholder="your@email.com" /></div>
                        </div>
                        <div className={styles.formGroup} style={{ marginBottom: '1rem' }}><label>Comment</label><textarea placeholder="Share your views on this IPO..." /></div>
                        <button className={styles.submitButton}>Submit Comment</button>
                    </div>

                    <div className={styles.commentsList}>
                        {ipo.comments.map((comment) => (
                            <div key={comment.id} className={styles.comment}>
                                <div className={styles.commentHeader}><span className={styles.commentAuthor}>{comment.author}</span><span className={styles.commentDate}>{formatDate(comment.date)}</span></div>
                                <div className={styles.commentBody}>{comment.body}</div>
                            </div>
                        ))}
                    </div>
                    <button className={styles.loadMore}>Load More Comments</button>
                </section>
            </div>

            {/* SECTION Q: Sticky Footer */}
            <div className={`${styles.stickyFooter} ${showStickyFooter ? styles.visible : ''}`}>
                <div className={styles.footerContent}>
                    <span className={styles.footerTitle}>Track {ipo.companyName} IPO</span>
                    <div className={styles.footerActions}>
                        <button className={`${styles.footerButton} ${styles.alertBtn}`}>🔔 Set Alert</button>
                        <button className={`${styles.footerButton} ${styles.watchlistBtn}`}>⭐ Watchlist</button>
                        <button className={`${styles.footerButton} ${styles.shareBtn}`}>📤 Share</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

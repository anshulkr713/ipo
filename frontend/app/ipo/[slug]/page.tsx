import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import IPOSchema from './IPOSchema';
import { ProfitCalculator, DiscussionSection, StickyFooter } from './IPOClientComponents';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';

// 1. Fetch Data on Server using Supabase
async function getIPOData(slug: string) {
    const { data: ipo, error } = await supabase
        .from('ipos')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !ipo) {
        console.error('Error fetching IPO:', error);
        return null;
    }

    // Fetch comments for this IPO (if comments table exists)
    const { data: comments } = await supabase
        .from('ipo_comments')
        .select('*')
        .eq('ipo_id', ipo.id)
        .order('created_at', { ascending: false });

    return {
        ...ipo,
        comments: comments || []
    };
}

// 2. SEO Metadata Generation
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const ipo = await getIPOData(resolvedParams.slug);

    if (!ipo) {
        return {
            title: 'IPO Not Found | IPO Central',
            description: 'The requested IPO details could not be found.'
        };
    }

    // Use the existing column names from Supabase
    const gmp = ipo.gmp || 0;
    const gmpText = gmp > 0 ? `GMP ₹${gmp}` : 'Live Updates';
    const companyName = ipo.company_name || ipo.ipo_name || 'IPO';
    const minPrice = ipo.min_price || 0;
    const maxPrice = ipo.max_price || 0;

    return {
        title: `${companyName} IPO ${gmpText}, Review, Allotment Status`,
        description: `${companyName} IPO GMP Today is ₹${gmp}. Check subscription status, price band ₹${minPrice}-${maxPrice}, listing date, and broker recommendation.`,
        keywords: [
            `${companyName} IPO`,
            `${companyName} IPO GMP`,
            `${companyName} IPO allotment status`,
            `${companyName} IPO review`
        ],
        openGraph: {
            title: `${companyName} IPO Details - GMP ₹${gmp}`,
            description: `Live Subscription and GMP Analysis for ${companyName} IPO.`,
            type: 'article',
        }
    };
}

// 3. Formatting Helpers
const formatCurrency = (amount: number | null) => amount ? `₹${amount.toLocaleString('en-IN')}` : '₹0';
const formatDate = (date: string | Date | null) => {
    if (!date) return 'TBA';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// 4. Main Page Component
export default async function IPODetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const ipo = await getIPOData(resolvedParams.slug);

    if (!ipo) {
        notFound();
    }

    // Map Supabase columns to display - use existing columns from the api.ts
    const companyName = ipo.company_name || ipo.ipo_name || 'IPO';
    const gmp = ipo.gmp || 0;
    const gmpPercentage = ipo.gain_percent || 0;
    const minPrice = ipo.min_price || 0;
    const maxPrice = ipo.max_price || 0;
    const lotSize = ipo.lot_size || 0;
    const status = ipo.status || 'upcoming';

    // Subscription data
    const subscriptionRetail = ipo.subscription_retail || 0;
    const subscriptionNII = ipo.subscription_nii || 0;
    const subscriptionQIB = ipo.subscription_qib || 0;
    const subscriptionTotal = ipo.subscription_total || 0;

    return (
        <div className={styles.pageWrapper}>
            {/* SEO Schema Injection */}
            <IPOSchema
                companyName={companyName}
                slug={ipo.slug}
                gmp={gmp}
                priceMin={minPrice}
                priceMax={maxPrice}
                openDate={ipo.open_date}
                closeDate={ipo.close_date}
                allotmentDate={ipo.allotment_date}
                listingDate={ipo.listing_date}
                registrar={ipo.registrar}
            />

            <div className={styles.container}>
                {/* Breadcrumb */}
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                    <ol itemScope itemType="https://schema.org/BreadcrumbList">
                        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                            <Link href="/" itemProp="item"><span itemProp="name">Home</span></Link>
                            <meta itemProp="position" content="1" />
                        </li>
                        <li>/</li>
                        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                            <Link href="/upcoming-ipos" itemProp="item"><span itemProp="name">IPOs</span></Link>
                            <meta itemProp="position" content="2" />
                        </li>
                        <li>/</li>
                        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                            <span itemProp="name" aria-current="page">{companyName} IPO</span>
                            <meta itemProp="position" content="3" />
                        </li>
                    </ol>
                </nav>

                {/* Hero Section */}
                <section className={styles.hero}>
                    <div className={styles.heroHeader}>
                        <div className={styles.heroLeft}>
                            <div className={styles.companyLogo} role="img" aria-label={`${companyName} Logo`}>
                                {companyName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className={styles.heroTitle}>{companyName} IPO</h1>
                                <span className={`${styles.statusBadge} ${status === 'open' ? styles.statusOpen : styles.statusClosed}`}>
                                    ● {status.toUpperCase()}
                                </span>
                                <p className={styles.lastUpdated}>
                                    Updated: <time dateTime={ipo.updated_at}>{formatDate(ipo.updated_at)}</time>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Grey Market Premium</div>
                            <div className={styles.metricValue}>{formatCurrency(gmp)}</div>
                            <div className={`${styles.metricChange} ${styles.positive}`}>
                                {gmpPercentage ? `+${gmpPercentage}%` : 'N/A'}
                            </div>
                        </div>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Price Band</div>
                            <div className={styles.metricValue}>
                                {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
                            </div>
                        </div>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Lot Size</div>
                            <div className={styles.metricValue}>{lotSize} Shares</div>
                        </div>
                        {subscriptionTotal > 0 && (
                            <div className={styles.metricCard}>
                                <div className={styles.metricLabel}>Total Subscription</div>
                                <div className={styles.metricValue}>{subscriptionTotal}x</div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Profit Calculator (Interactive Client Component) */}
                <ProfitCalculator
                    gmp={gmp}
                    lotSize={lotSize || 1}
                    priceMax={maxPrice || minPrice || 100}
                />

                {/* Subscription Details */}
                {subscriptionTotal > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}>📊</span> Subscription Status
                        </h2>
                        <div className={styles.metricsGrid}>
                            <div className={styles.metricCard}>
                                <div className={styles.metricLabel}>QIB</div>
                                <div className={styles.metricValue}>{subscriptionQIB}x</div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricLabel}>NII</div>
                                <div className={styles.metricValue}>{subscriptionNII}x</div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricLabel}>Retail</div>
                                <div className={styles.metricValue}>{subscriptionRetail}x</div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricLabel}>Total</div>
                                <div className={styles.metricValue}>{subscriptionTotal}x</div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Key Dates */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>📅</span> Key Dates
                    </h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <tbody>
                                <tr>
                                    <td><strong>Open Date</strong></td>
                                    <td>{formatDate(ipo.open_date)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Close Date</strong></td>
                                    <td>{formatDate(ipo.close_date)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Allotment Date</strong></td>
                                    <td>{formatDate(ipo.allotment_date)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Listing Date</strong></td>
                                    <td>{formatDate(ipo.listing_date)}</td>
                                </tr>
                                {ipo.registrar && (
                                    <tr>
                                        <td><strong>Registrar</strong></td>
                                        <td>{ipo.registrar}</td>
                                    </tr>
                                )}
                                {ipo.category && (
                                    <tr>
                                        <td><strong>Category</strong></td>
                                        <td>{ipo.category}</td>
                                    </tr>
                                )}
                                {ipo.issue_size && (
                                    <tr>
                                        <td><strong>Issue Size</strong></td>
                                        <td>{ipo.issue_size}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* About Company */}
                {ipo.description && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}>🏢</span> About {companyName}
                        </h2>
                        <p style={{ lineHeight: 1.8, color: '#475569' }}>{ipo.description}</p>
                    </section>
                )}

                {/* Discussion Section (Interactive Client Component) */}
                <DiscussionSection
                    comments={ipo.comments || []}
                    ipoSlug={ipo.slug}
                    ipoId={ipo.id?.toString() || '0'}
                />
            </div>

            {/* Sticky Footer (Interactive Client Component) */}
            <StickyFooter
                companyName={companyName}
                status={status}
            />
        </div>
    );
}
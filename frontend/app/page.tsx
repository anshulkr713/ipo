'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import FeaturedIPOCard from '@/components/homepage/FeaturedIPOCard';
import IPOCategoryChart from '@/components/homepage/IPOCategoryChart';
import DashboardTabs from '@/components/homepage/DashboardTabs';
import IPOFilters from '@/components/homepage/IPOFilters';
import ShouldIApplyCalculator from '@/components/homepage/ShouldIApplyCalculator';
import SubscriptionHeatmap from '@/components/homepage/SubscriptionHeatmap';
import IPOCalendarWidget from '@/components/homepage/IPOCalendarWidget';
import ComparisonTable from '@/components/homepage/ComparisonTable';
import {
  fetchFeaturedIPOs,
  fetchOpenIPOs,
} from '@/lib/api';

// Note: Metadata is handled in layout.tsx for client components
// ISR revalidation is set in the layout

export default function Home() {
  const [featuredIPOs, setFeaturedIPOs] = useState<any[]>([]);
  const [openIPOs, setOpenIPOs] = useState<any[]>([]);
  const [filteredCategory, setFilteredCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [featured, open] = await Promise.all([
        fetchFeaturedIPOs(),
        fetchOpenIPOs(),
      ]);
      setFeaturedIPOs(featured);
      setOpenIPOs(open);
    } catch (error) {
      console.error('Error loading homepage data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p className={styles.loadingText}>Loading IPO Tracker...</p>
      </div>
    );
  }

  return (
    <main className={styles.homepage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          {/* Left side - Text */}
          <div className={styles.heroText}>
            <div className={styles.heroBadge}>
              <div className={styles.pulseDot}></div>
              <span className={styles.badgeText}>Real-Time Market Intelligence</span>
            </div>

            <h1 className={styles.heroTitle}>
              TRACK MARKET<br />
              <span className={styles.gradientText}>INTELLIGENCE</span><br />
              IN REAL-TIME
            </h1>

            <p className={styles.heroSubtitle}>
              Live GMP tracking, subscription data, and comprehensive IPO analysis for informed investment decisions
            </p>

            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>50+</div>
                <div className={styles.statLabel}>Active IPOs Tracked</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>Real-Time</div>
                <div className={styles.statLabel}>GMP Updates</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>100%</div>
                <div className={styles.statLabel}>Accurate Data</div>
              </div>
            </div>
          </div>

          {/* Right side - Floating Card */}
          {featuredIPOs.length > 0 && (
            <div className={styles.heroCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{featuredIPOs[0].company_name || 'TATA TECHNOLOGIES'}</h3>
                <div className={styles.liveBadge}>
                  <span className={styles.liveDot}></span>
                  LIVE
                </div>
              </div>
              <div className={styles.cardMetrics}>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>GMP</div>
                  <div className={styles.metricValue}>₹{featuredIPOs[0].current_gmp || 485}</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>GAIN</div>
                  <div className={`${styles.metricValue} ${styles.positive}`}>+{featuredIPOs[0].expected_gain_percent || 97}%</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>SUB</div>
                  <div className={styles.metricValue}>{featuredIPOs[0].subscription_total || 69.43}x</div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.cardFooterItem}>
                  <span className={styles.footerLabel}>Retail Subscription</span>
                  <span className={styles.footerValue}>{featuredIPOs[0].subscription_retail || 12.87}x</span>
                </div>
                <div className={styles.cardFooterItem}>
                  <span className={styles.footerLabel}>Issue Price</span>
                  <span className={styles.footerValue}>₹{featuredIPOs[0].price_band_low || 50}</span>
                </div>
                <div className={styles.cardFooterItem}>
                  <span className={styles.footerLabel}>Time Remaining</span>
                  <span className={styles.footerValue}>3 Days</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cards Section */}
      <div className={styles.container}>
        {/* Featured IPO Cards */}
        <div className={styles.cardsGrid}>
          {featuredIPOs.length > 0 ? (
            featuredIPOs.map((ipo: any) => (
              <FeaturedIPOCard key={ipo.id} ipo={ipo} />
            ))
          ) : (
            <div className={styles.noFeatured}>
              <p>🔍 No featured IPOs available at the moment</p>
              <p className={styles.noFeaturedSub}>Check back soon for hot IPO opportunities!</p>
            </div>
          )}
        </div>

        {/* IPO Category Chart Section */}
        <IPOCategoryChart />
      </div>

      {/* Dashboard Section */}
      <section className={styles.dashboardSection}>
        <h2 className={styles.sectionTitle}>📊 Live Dashboard</h2>
        <DashboardTabs />
      </section>



      {/* Calculator */}
      <section className={styles.calculatorSection}>
        <h2 className={styles.sectionTitle}>🧮 Should I Apply Calculator</h2>
        <ShouldIApplyCalculator ipos={openIPOs} />
      </section>

      {/* Heatmap */}
      <section className={styles.heatmapSection}>
        <h2 className={styles.sectionTitle}>🔥 Heatmap</h2>
        <SubscriptionHeatmap />
      </section>

      {/* Calendar */}
      <section className={styles.calendarSection}>
        <h2 className={styles.sectionTitle}>📅 IPO Calendar</h2>
        <IPOCalendarWidget />
      </section>

      {/* Comparison Table */}
      <section className={styles.comparisonSection}>
        <h2 className={styles.sectionTitle}>📋 IPO Comparison Table</h2>
        <ComparisonTable category={filteredCategory} />
      </section>
    </main>
  );
}
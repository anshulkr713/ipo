'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import FeaturedIPOCard from '@/components/homepage/FeaturedIPOCard';
import MarketSentimentGauge from '@/components/homepage/MarketSentimentGauge';
import QuickActionButtons from '@/components/homepage/QuickActionButtons';
import DashboardTabs from '@/components/homepage/DashboardTabs';
import IPOFilters from '@/components/homepage/IPOFilters';
import ShouldIApplyCalculator from '@/components/homepage/ShouldIApplyCalculator';
import SubscriptionHeatmap from '@/components/homepage/SubscriptionHeatmap';
import IPOCalendarWidget from '@/components/homepage/IPOCalendarWidget';
import ComparisonTable from '@/components/homepage/ComparisonTable';
import {
  fetchFeaturedIPOs,
  fetchMarketSentiment,
  fetchOpenIPOs,
} from '@/lib/api';

export default function Home() {
  const [featuredIPOs, setFeaturedIPOs] = useState<any[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<any>(null);
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
      const [featured, sentiment, open] = await Promise.all([
        fetchFeaturedIPOs(),
        fetchMarketSentiment(),
        fetchOpenIPOs(),
      ]);
      setFeaturedIPOs(featured);
      setMarketSentiment(sentiment);
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
          <h1 className={styles.heroTitle}>Track Market Intelligence in Real-Time</h1>
          <p className={styles.heroSubtitle}>
            Live GMP tracking, subscription data, and comprehensive IPO analysis for informed investment decisions
          </p>
        </div>

        {/* Featured IPO Cards */}
        <div className={styles.featuredGrid}>
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

        {/* Market Sentiment & Quick Actions */}
        <div className={styles.heroBottom}>
          <MarketSentimentGauge data={marketSentiment} />
          <QuickActionButtons />
        </div>
      </section>

      {/* Dashboard Section */}
      <section className={styles.dashboardSection}>
        <h2 className={styles.sectionTitle}>📊 Live Dashboard</h2>
        <DashboardTabs />
      </section>

      {/* Filters */}
      <section className={styles.filtersSection}>
        <IPOFilters
          selectedCategory={filteredCategory}
          onCategoryChange={setFilteredCategory}
        />
      </section>

      {/* Calculator */}
      <section className={styles.calculatorSection}>
        <h2 className={styles.sectionTitle}>🧮 Should I Apply Calculator</h2>
        <ShouldIApplyCalculator ipos={openIPOs} />
      </section>

      {/* Heatmap */}
      <section className={styles.heatmapSection}>
        <h2 className={styles.sectionTitle}>🔥 Subscription Heatmap</h2>
        <SubscriptionHeatmap ipos={openIPOs} />
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
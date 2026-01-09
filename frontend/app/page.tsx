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
          <h1 className={styles.heroTitle}>TRACK MARKET INTELLIGENCE IN REAL-TIME</h1>
          <p className={styles.heroSubtitle}>
            Live GMP tracking, subscription data, and comprehensive IPO analysis for informed investment decisions
          </p>
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
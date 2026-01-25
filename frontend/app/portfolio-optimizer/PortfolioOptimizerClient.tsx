// portfolio-optimizer/PortfolioOptimizerClient.tsx
// Updated to use new CapitalInput component with IPO pool and shareholder support

'use client';

import { useState, useEffect } from 'react';
import { fetchOpenIPOs } from '@/lib/portfolio/ipoDataFetcher';
import { generateMultiAccountStrategies } from '@/lib/portfolio/multiAccountStrategy';
import { generateAllStrategies } from '@/lib/portfolio/strategyGenerator';
import { IPO, UserPortfolio, ApplicationStrategy } from '@/lib/portfolio/types';
import CapitalInput from '@/components/CapitalInput';
import styles from './page.module.css';

export default function PortfolioOptimizerClient() {
  const [openIPOs, setOpenIPOs] = useState<IPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Results
  const [strategies, setStrategies] = useState<ApplicationStrategy[]>([]);

  // Fetch open IPOs on mount
  useEffect(() => {
    loadOpenIPOs();
  }, []);

  async function loadOpenIPOs() {
    setLoading(true);
    const ipos = await fetchOpenIPOs();
    setOpenIPOs(ipos);
    setLoading(false);
  }

  // Generate strategies with new parameters
  async function handleGenerateStrategies(config: {
    totalCapital: number;
    numRetailAccounts: number;
    shareholderEligibleIPOs: string[];
    excludedIPOs: string[];
  }) {
    const { totalCapital, numRetailAccounts, shareholderEligibleIPOs, excludedIPOs } = config;

    // Validation
    if (totalCapital < 10000) {
      alert('Please enter at least ₹10,000 capital');
      return;
    }

    if (numRetailAccounts < 1 || numRetailAccounts > 20) {
      alert('Please enter 1-20 people');
      return;
    }

    // Filter out excluded IPOs
    const filteredIPOs = openIPOs.filter(ipo => !excludedIPOs.includes(ipo.slug));

    if (filteredIPOs.length === 0) {
      alert('No IPOs selected. Please include at least one IPO.');
      return;
    }

    setCalculating(true);

    try {
      const userPortfolio: UserPortfolio = {
        totalCapital,
        numRetailAccounts,
        shareholderEligibleIPOs, // NEW: Pass shareholder eligibility
        hasHNICapability: false
      };

      // Generate strategies based on number of accounts
      if (numRetailAccounts > 1) {
        const multiStrats = await generateMultiAccountStrategies(userPortfolio, filteredIPOs);
        setStrategies(multiStrats);
      } else {
        const singleStrats = await generateAllStrategies(totalCapital, filteredIPOs);
        setStrategies(singleStrats.strategies);
      }
    } catch (error) {
      console.error('Error generating strategies:', error);
      alert('Error calculating strategies. Please try again.');
    } finally {
      setCalculating(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <header className={styles.header}>
        <h1>
          💼 IPO <span className={styles.gradientText}>Portfolio Optimizer</span>
        </h1>
        <p className={styles.headerSubtitle}>
          Get AI-powered strategies to maximize your IPO returns
        </p>
      </header>

      {/* IPO Status Badge */}
      <div style={{ textAlign: 'center' }}>
        <div className={styles.ipoStatus}>
          <span className={styles.statusDot}></span>
          {loading ? (
            <span>Loading open IPOs...</span>
          ) : (
            <span>
              <strong>{openIPOs.length} IPOs</strong> Currently Open
              ({openIPOs.filter(ipo => ipo.category === 'Mainboard').length} Mainboard,{' '}
              {openIPOs.filter(ipo => ipo.category === 'SME').length} SME)
            </span>
          )}
        </div>
      </div>

      {/* New Capital Input Component with IPO Pool */}
      {!loading && (
        <CapitalInput
          openIPOs={openIPOs}
          onGenerate={handleGenerateStrategies}
        />
      )}

      {/* Loading State */}
      {calculating && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
            <p>🔮 Calculating Optimal Strategies...</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {strategies.length > 0 && (
        <div className={styles.resultsSection}>
          <h2 className={styles.resultsTitle}>📊 Your Personalized Strategies</h2>

          {strategies.map((strategy, index) => (
            <div
              key={strategy.strategyId}
              className={`${styles.strategyCard} ${index === 0 ? styles.recommended : ''}`}
            >
              {index === 0 && (
                <div className={styles.recommendedBadge}>🏆 RECOMMENDED</div>
              )}

              <h3 className={styles.strategyName}>{strategy.strategyName}</h3>
              <p className={styles.strategyDescription}>{strategy.description}</p>

              {/* Key Metrics */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricItem}>
                  <div className={styles.metricLabel}>Investment</div>
                  <div className={styles.metricValue}>₹{strategy.totalCost.toLocaleString()}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricLabel}>Expected Profit</div>
                  <div className={`${styles.metricValue} ${styles.profit}`}>
                    ₹{Math.round(strategy.expectedProfit).toLocaleString()}
                  </div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricLabel}>Success Rate</div>
                  <div className={styles.metricValue}>{strategy.weightedProbability.toFixed(1)}%</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricLabel}>Risk Level</div>
                  <div className={`${styles.metricValue} ${styles[strategy.riskScore.toLowerCase()]}`}>
                    {strategy.riskScore === 'LOW' ? '🟢' : strategy.riskScore === 'MEDIUM' ? '🟡' : '🔴'}
                    {' '}{strategy.riskScore}
                  </div>
                </div>
              </div>

              {/* Applications List */}
              <div className={styles.applicationsCard}>
                <div className={styles.applicationsTitle}>
                  📋 Applications ({strategy.applications.length}):
                </div>
                {strategy.applications.map((app, i) => (
                  <div key={i} className={styles.applicationItem}>
                    <div className={styles.appInfo}>
                      <div className={styles.appName}>{app.ipo.company_name}</div>
                      <div className={styles.appDetails}>
                        {app.category.toUpperCase()} • {app.numLots} lot(s) • ₹{app.totalCost.toLocaleString()}
                      </div>
                    </div>
                    <div className={styles.appProbability}>
                      <div className={styles.appProbValue}>{app.allotmentProbability.toFixed(1)}%</div>
                      <div className={styles.appProbLabel}>chance</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div className={styles.recommendationBox}>
                <strong>💡 Why This Works:</strong> {strategy.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
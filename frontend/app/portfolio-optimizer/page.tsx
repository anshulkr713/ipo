'use client';

import { useState, useEffect } from 'react';
import { fetchOpenIPOs } from '@/lib/portfolio/ipoDataFetcher';
import { generateMultiAccountStrategies } from '@/lib/portfolio/multiAccountStrategy';
import { generateAllStrategies } from '@/lib/portfolio/strategyGenerator';
import { IPO, UserPortfolio, RetailAccount, ApplicationStrategy } from '@/lib/portfolio/types';
import CapitalInput from './components/CapitalInput';
import AccountManager from './components/AccountManager';
import StrategyCard from './components/StrategyCard';
import ComparisonTable from './components/ComparisonTable';
import styles from './page.module.css';

export default function PortfolioOptimizer() {
  const [openIPOs, setOpenIPOs] = useState<IPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  // User portfolio state
  const [totalCapital, setTotalCapital] = useState<number>(50000);
  const [retailAccounts, setRetailAccounts] = useState<RetailAccount[]>([
    {
      accountId: '1',
      accountName: 'Self',
      availableCapital: 50000,
      panLinked: true,
      dematAccount: 'XXXX-XXXX-XXXX'
    }
  ]);
  const [hasHNI, setHasHNI] = useState(false);
  const [hniCapital, setHniCapital] = useState(0);
  
  // Results
  const [strategies, setStrategies] = useState<ApplicationStrategy[]>([]);
  const [multiAccountStrategies, setMultiAccountStrategies] = useState<ApplicationStrategy[]>([]);

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

  // Generate strategies
  async function handleGenerateStrategies() {
    if (openIPOs.length === 0) {
      alert('No open IPOs available');
      return;
    }

    setCalculating(true);

    try {
      const userPortfolio: UserPortfolio = {
        totalCapital,
        retailAccounts,
        hasHNICapability: hasHNI,
        hniCapital: hasHNI ? hniCapital : undefined
      };

      // Generate strategies based on number of accounts
      if (retailAccounts.length > 1) {
        // Multi-account strategies
        const multiStrats = await generateMultiAccountStrategies(userPortfolio, openIPOs);
        setMultiAccountStrategies(multiStrats);
        setStrategies([]); // Clear single-account strategies
      } else {
        // Single-account strategies
        const singleStrats = await generateAllStrategies(totalCapital, openIPOs);
        setStrategies(singleStrats.strategies);
        setMultiAccountStrategies([]); // Clear multi-account strategies
      }
    } catch (error) {
      console.error('Error generating strategies:', error);
      alert('Error calculating strategies. Please try again.');
    } finally {
      setCalculating(false);
    }
  }

  // Add new retail account
  function addRetailAccount() {
    const newAccount: RetailAccount = {
      accountId: Date.now().toString(),
      accountName: `Account ${retailAccounts.length + 1}`,
      availableCapital: 50000,
      panLinked: true,
      dematAccount: ''
    };
    setRetailAccounts([...retailAccounts, newAccount]);
  }

  // Update retail account
  function updateRetailAccount(accountId: string, updates: Partial<RetailAccount>) {
    setRetailAccounts(accounts =>
      accounts.map(acc =>
        acc.accountId === accountId ? { ...acc, ...updates } : acc
      )
    );
  }

  // Remove retail account
  function removeRetailAccount(accountId: string) {
    setRetailAccounts(accounts =>
      accounts.filter(acc => acc.accountId !== accountId)
    );
  }

  const allStrategies = retailAccounts.length > 1 ? multiAccountStrategies : strategies;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>💼 IPO Portfolio Optimizer</h1>
        <p>Maximize your returns with AI-powered strategy recommendations</p>
      </header>

      {/* IPO Status */}
      <div className={styles.ipoStatus}>
        {loading ? (
          <p>Loading open IPOs...</p>
        ) : (
          <p>
            📊 Currently Open: <strong>{openIPOs.length} IPOs</strong>
            {' '}(
            {openIPOs.filter(ipo => ipo.category === 'Mainboard').length} Mainboard,{' '}
            {openIPOs.filter(ipo => ipo.category === 'SME').length} SME)
          </p>
        )}
      </div>

      {/* Input Section */}
      <section className={styles.inputSection}>
        <CapitalInput
          totalCapital={totalCapital}
          onChange={setTotalCapital}
        />

        <AccountManager
          accounts={retailAccounts}
          onAdd={addRetailAccount}
          onUpdate={updateRetailAccount}
          onRemove={removeRetailAccount}
        />

        {/* HNI Toggle */}
        <div className={styles.hniToggle}>
          <label>
            <input
              type="checkbox"
              checked={hasHNI}
              onChange={(e) => setHasHNI(e.target.checked)}
            />
            I have HNI capital (₹2L+)
          </label>
          
          {hasHNI && (
            <input
              type="number"
              value={hniCapital}
              onChange={(e) => setHniCapital(Number(e.target.value))}
              placeholder="HNI Capital"
              min={200000}
              step={10000}
            />
          )}
        </div>

        <button
          className={styles.generateButton}
          onClick={handleGenerateStrategies}
          disabled={calculating || loading}
        >
          {calculating ? '🔮 Calculating...' : '✨ Generate Optimal Strategies'}
        </button>
      </section>

      {/* Results Section */}
      {allStrategies.length > 0 && (
        <section className={styles.resultsSection}>
          <h2>📊 Recommended Strategies</h2>
          
          {/* Show multi-account benefit callout */}
          {retailAccounts.length > 1 && (
            <div className={styles.multiAccountBenefit}>
              <strong>🎯 Multi-Account Advantage:</strong> With {retailAccounts.length} accounts,
              your chances of getting allotment increase significantly!
            </div>
          )}

          {/* Strategy Cards */}
          <div className={styles.strategyGrid}>
            {allStrategies.map((strategy, index) => (
              <StrategyCard
                key={strategy.strategyId}
                strategy={strategy}
                rank={index + 1}
                isRecommended={index === 0}
              />
            ))}
          </div>

          {/* Comparison Table */}
          <ComparisonTable strategies={allStrategies} />
        </section>
      )}
    </div>
  );
}
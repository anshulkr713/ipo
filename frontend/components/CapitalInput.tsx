// Enhanced CapitalInput.tsx - Support for 7+ PANs and IPO Pool with Shareholder Toggle
'use client';

import { useState, useEffect } from 'react';
import styles from './CapitalInput.module.css';

interface IPO {
    slug: string;
    ipo_name: string;
    company_name: string;
    close_date: string;
    has_shareholder_quota: boolean;
    status: 'open' | 'upcoming' | 'closed';
}

interface CapitalInputProps {
    openIPOs: IPO[];
    onGenerate: (config: {
        totalCapital: number;
        numRetailAccounts: number;
        shareholderEligibleIPOs: string[];
        excludedIPOs: string[];
    }) => void;
}

export default function CapitalInput({ openIPOs, onGenerate }: CapitalInputProps) {
    const [totalCapital, setTotalCapital] = useState<number>(50000);
    const [numAccounts, setNumAccounts] = useState<number>(1);
    const [customAccounts, setCustomAccounts] = useState<string>('');
    const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

    // IPO Pool state
    const [selectedIPOs, setSelectedIPOs] = useState<Set<string>>(new Set());
    const [shareholderIPOs, setShareholderIPOs] = useState<Set<string>>(new Set());
    const [showIPOPool, setShowIPOPool] = useState<boolean>(false);

    const capitalPresets = [30000, 50000, 100000, 250000, 500000];
    const accountPresets = [1, 2, 3, 4, 5, 6];

    useEffect(() => {
        // Auto-select all open IPOs by default
        const openSlugs = openIPOs.filter(ipo => ipo.status === 'open').map(ipo => ipo.slug);
        setSelectedIPOs(new Set(openSlugs));
    }, [openIPOs]);

    const handleCapitalPreset = (amount: number) => {
        setTotalCapital(amount);
    };

    const handleAccountSelect = (count: number) => {
        setNumAccounts(count);
        setShowCustomInput(false);
        setCustomAccounts('');
    };

    const handleCustomAccountsClick = () => {
        setShowCustomInput(true);
    };

    const handleCustomAccountsChange = (value: string) => {
        setCustomAccounts(value);
        const parsed = parseInt(value);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 20) {
            setNumAccounts(parsed);
        }
    };

    const toggleIPOSelection = (slug: string) => {
        const newSelected = new Set(selectedIPOs);
        if (newSelected.has(slug)) {
            newSelected.delete(slug);
            // Also remove from shareholder if deselected
            const newShareholder = new Set(shareholderIPOs);
            newShareholder.delete(slug);
            setShareholderIPOs(newShareholder);
        } else {
            newSelected.add(slug);
        }
        setSelectedIPOs(newSelected);
    };

    const toggleShareholderStatus = (slug: string) => {
        const newShareholder = new Set(shareholderIPOs);
        if (newShareholder.has(slug)) {
            newShareholder.delete(slug);
        } else {
            newShareholder.add(slug);
        }
        setShareholderIPOs(newShareholder);
    };

    const handleGenerate = () => {
        const excludedIPOs = openIPOs
            .filter(ipo => !selectedIPOs.has(ipo.slug))
            .map(ipo => ipo.slug);

        onGenerate({
            totalCapital,
            numRetailAccounts: numAccounts,
            shareholderEligibleIPOs: Array.from(shareholderIPOs),
            excludedIPOs
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.icon}>🎯</span>
                <h2 className={styles.title}>LET&apos;S OPTIMIZE YOUR PORTFOLIO</h2>
            </div>

            {/* Capital Input Section */}
            <section className={styles.section}>
                <label className={styles.label}>
                    <span className={styles.labelIcon}>💰</span>
                    HOW MUCH TOTAL CAPITAL DO YOU HAVE?
                </label>

                <div className={styles.presetButtons}>
                    {capitalPresets.map((amount) => (
                        <button
                            key={amount}
                            className={`${styles.presetButton} ${totalCapital === amount ? styles.active : ''}`}
                            onClick={() => handleCapitalPreset(amount)}
                        >
                            ₹{amount >= 100000 ? `${amount / 100000}L` : `${amount / 1000}K`}
                        </button>
                    ))}
                </div>

                <input
                    type="number"
                    className={styles.input}
                    value={totalCapital}
                    onChange={(e) => setTotalCapital(parseInt(e.target.value) || 0)}
                    placeholder="Enter custom amount"
                />
                <p className={styles.helpText}>Total amount you want to invest across all accounts</p>
            </section>

            {/* Accounts Section */}
            <section className={styles.section}>
                <label className={styles.label}>
                    <span className={styles.labelIcon}>👥</span>
                    HOW MANY PEOPLE CAN APPLY? (INCLUDING FAMILY)
                </label>

                <div className={styles.accountButtons}>
                    {accountPresets.map((count) => (
                        <button
                            key={count}
                            className={`${styles.accountButton} ${!showCustomInput && numAccounts === count ? styles.active : ''}`}
                            onClick={() => handleAccountSelect(count)}
                        >
                            {count}
                        </button>
                    ))}
                    <button
                        className={`${styles.accountButton} ${styles.customButton} ${showCustomInput ? styles.active : ''}`}
                        onClick={handleCustomAccountsClick}
                    >
                        7+
                    </button>
                </div>

                {showCustomInput && (
                    <div className={styles.customInputWrapper}>
                        <input
                            type="number"
                            className={styles.customInput}
                            value={customAccounts}
                            onChange={(e) => handleCustomAccountsChange(e.target.value)}
                            placeholder="Enter number (max 20)"
                            min="7"
                            max="20"
                            autoFocus
                        />
                        <p className={styles.helpText}>Enter between 7-20 PANs</p>
                    </div>
                )}

                <p className={styles.helpText}>
                    Self, Parents, Spouse, Siblings - each needs separate Demat account
                </p>
            </section>

            {/* Summary Box */}
            <div className={styles.summaryBox}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>TOTAL CAPITAL</span>
                    <span className={styles.summaryValue}>₹{totalCapital.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>ACCOUNTS</span>
                    <span className={styles.summaryValue}>{numAccounts}</span>
                </div>
            </div>

            {/* IPO Pool Section */}
            <section className={styles.section}>
                <div className={styles.poolHeader}>
                    <label className={styles.label}>
                        <span className={styles.labelIcon}>📊</span>
                        IPO POOL ({selectedIPOs.size} selected)
                    </label>
                    <button
                        className={styles.togglePoolButton}
                        onClick={() => setShowIPOPool(!showIPOPool)}
                    >
                        {showIPOPool ? '▼ Hide' : '▶ Show & Customize'}
                    </button>
                </div>

                {showIPOPool && (
                    <div className={styles.ipoPool}>
                        {openIPOs.length === 0 ? (
                            <div className={styles.emptyPool}>
                                <p>No open IPOs available at the moment</p>
                            </div>
                        ) : (
                            <div className={styles.ipoGrid}>
                                {openIPOs.map((ipo) => {
                                    const isSelected = selectedIPOs.has(ipo.slug);
                                    const isShareholder = shareholderIPOs.has(ipo.slug);
                                    const hasQuota = ipo.has_shareholder_quota;

                                    return (
                                        <div
                                            key={ipo.slug}
                                            className={`${styles.ipoCard} ${!isSelected ? styles.disabled : ''}`}
                                        >
                                            {/* Header with checkbox */}
                                            <div className={styles.ipoCardHeader}>
                                                <label className={styles.checkboxWrapper}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleIPOSelection(ipo.slug)}
                                                        className={styles.checkbox}
                                                    />
                                                    <span className={styles.checkboxLabel}>Include</span>
                                                </label>

                                                {ipo.status === 'open' && (
                                                    <span className={styles.statusBadge}>🟢 Open</span>
                                                )}
                                            </div>

                                            {/* Clickable area for IPO selection toggle */}
                                            <div
                                                className={styles.ipoClickArea}
                                                onClick={() => toggleIPOSelection(ipo.slug)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {/* IPO Name */}
                                                <h4 className={styles.ipoName}>{ipo.company_name}</h4>
                                                <p className={styles.ipoClosing}>
                                                    Closes: {new Date(ipo.close_date).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </p>
                                            </div>

                                            {/* Shareholder Toggle - Show for all selected IPOs */}
                                            {isSelected && (
                                                <div className={styles.shareholderSection}>
                                                    <div className={styles.shareholderToggle}>
                                                        <button
                                                            className={`${styles.toggleButton} ${isShareholder ? styles.toggleActive : ''}`}
                                                            onClick={() => toggleShareholderStatus(ipo.slug)}
                                                        >
                                                            <span className={styles.toggleIcon}>
                                                                {isShareholder ? '✅' : '⬜'}
                                                            </span>
                                                            <span className={styles.toggleText}>
                                                                {isShareholder ? 'I am a Shareholder' : 'Mark as Shareholder'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    {isShareholder && (
                                                        <p className={styles.shareholderNote}>
                                                            🎁 Priority allocation for shareholders
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Summary */}
                        {selectedIPOs.size > 0 && (
                            <div className={styles.poolSummary}>
                                <p>
                                    <strong>{selectedIPOs.size}</strong> IPO(s) selected
                                    {shareholderIPOs.size > 0 && (
                                        <>, including <strong>{shareholderIPOs.size}</strong> shareholder quota(s)</>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Generate Button */}
            <button
                className={styles.generateButton}
                onClick={handleGenerate}
                disabled={selectedIPOs.size === 0}
            >
                ⚡ GENERATE STRATEGIES
            </button>
        </div>
    );
}
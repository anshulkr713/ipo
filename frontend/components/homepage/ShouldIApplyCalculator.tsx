'use client';

import { useState } from 'react';
import styles from './ShouldIApplyCalculator.module.css';
import { calculateExpectedReturns } from '@/lib/api';

export default function ShouldIApplyCalculator({ ipos }: { ipos: any[] }) {
    const [selectedIPO, setSelectedIPO] = useState<any>(null);
    const [investment, setInvestment] = useState('15000');
    const [category, setCategory] = useState<'retail' | 'sNII' | 'bNII'>('retail');
    const [result, setResult] = useState<any>(null);

    const handleCalculate = () => {
        if (!selectedIPO || !investment) return;

        const investmentAmount = parseFloat(investment);
        const issuePrice = selectedIPO.issue_price || selectedIPO.max_price;

        const calculation = calculateExpectedReturns(
            investmentAmount,
            selectedIPO.gmp_amount,
            issuePrice,
            selectedIPO.lot_size,
            category,
            category === 'retail' ? selectedIPO.subscription_retail :
                category === 'sNII' ? selectedIPO.subscription_snii :
                    selectedIPO.subscription_bnii
        );

        setResult(calculation);
    };

    return (
        <div className={styles.container}>
            <div className={styles.inputs}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Select IPO</label>
                    <select
                        className={styles.select}
                        onChange={(e) => {
                            const ipo = ipos.find(i => i.id === parseInt(e.target.value));
                            setSelectedIPO(ipo);
                            setResult(null);
                        }}
                    >
                        <option value="">Choose an IPO...</option>
                        {ipos.map(ipo => (
                            <option key={ipo.id} value={ipo.id}>
                                {ipo.company_name || ipo.ipo_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Investment Amount (₹)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={investment}
                        onChange={(e) => setInvestment(e.target.value)}
                        placeholder="15000"
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Category</label>
                    <select
                        className={styles.select}
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                    >
                        <option value="retail">Retail (1 lot)</option>
                        <option value="sNII">sNII (&lt; ₹10L)</option>
                        <option value="bNII">bNII (&gt; ₹10L)</option>
                    </select>
                </div>

                <button className={styles.calculateButton} onClick={handleCalculate}>
                    Calculate Returns
                </button>
            </div>

            {result && (
                <div className={styles.results}>
                    <div className={styles.recommendation} style={{ borderColor: result.recommendation.color }}>
                        <span className={styles.recIcon}>{result.recommendation.icon}</span>
                        <span className={styles.recText}>{result.recommendation.text}</span>
                    </div>

                    <div className={styles.metricsGrid}>
                        <div className={styles.resultCard}>
                            <span className={styles.resultLabel}>Lots Applied</span>
                            <span className={styles.resultValue}>{result.numLots}</span>
                        </div>
                        <div className={styles.resultCard}>
                            <span className={styles.resultLabel}>Total Shares</span>
                            <span className={styles.resultValue}>{result.numShares}</span>
                        </div>
                        <div className={styles.resultCard}>
                            <span className={styles.resultLabel}>Total Investment</span>
                            <span className={styles.resultValue}>₹{result.totalInvestment.toLocaleString()}</span>
                        </div>
                        <div className={styles.resultCard}>
                            <span className={styles.resultLabel}>Expected Profit</span>
                            <span className={`${styles.resultValue} ${result.totalProfit >= 0 ? styles.profit : styles.loss}`}>
                                ₹{result.totalProfit.toLocaleString()}
                            </span>
                        </div>
                        <div className={styles.resultCard}>
                            <span className={styles.resultLabel}>Allotment Probability</span>
                            <span className={styles.resultValue}>{result.allotmentProb.toFixed(1)}%</span>
                        </div>
                        <div className={styles.resultCard}>
                            <span className={styles.resultLabel}>Expected Return</span>
                            <span className={`${styles.resultValue} ${result.expectedProfit >= 0 ? styles.profit : styles.loss}`}>
                                ₹{result.expectedProfit.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './ComparisonTable.module.css';
import { fetchAllIPOsForComparison } from '@/lib/api';

export default function ComparisonTable({ category }: { category: string }) {
    const [ipos, setIpos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'gmp' | 'subscription' | 'date'>('date');

    useEffect(() => {
        loadData();
    }, [category]);

    async function loadData() {
        const data = await fetchAllIPOsForComparison(category);
        setIpos(data);
        setLoading(false);
    }

    const sortedIPOs = [...ipos].sort((a, b) => {
        if (sortBy === 'gmp') return b.gmp_percentage - a.gmp_percentage;
        if (sortBy === 'subscription') return b.subscription_total - a.subscription_total;
        return new Date(b.open_date).getTime() - new Date(a.open_date).getTime();
    });

    if (loading) {
        return <div className={styles.loading}>Loading comparison data...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <div className={styles.sortButtons}>
                    <button
                        className={`${styles.sortButton} ${sortBy === 'date' ? styles.active : ''}`}
                        onClick={() => setSortBy('date')}
                    >
                        Sort by Date
                    </button>
                    <button
                        className={`${styles.sortButton} ${sortBy === 'gmp' ? styles.active : ''}`}
                        onClick={() => setSortBy('gmp')}
                    >
                        Sort by GMP
                    </button>
                    <button
                        className={`${styles.sortButton} ${sortBy === 'subscription' ? styles.active : ''}`}
                        onClick={() => setSortBy('subscription')}
                    >
                        Sort by Subscription
                    </button>
                </div>
                <button className={styles.exportButton}>
                    📥 Export to CSV
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Category</th>
                            <th>Price Band</th>
                            <th>GMP</th>
                            <th>% Gain</th>
                            <th>Lot Size</th>
                            <th>Subscription</th>
                            <th>Open Date</th>
                            <th>Close Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedIPOs.map(ipo => (
                            <tr key={ipo.id}>
                                <td className={styles.companyCell}>
                                    <strong>{ipo.company_name || ipo.ipo_name}</strong>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${ipo.category === 'SME' ? styles.sme : styles.mainboard}`}>
                                        {ipo.category}
                                    </span>
                                </td>
                                <td>₹{ipo.min_price}-{ipo.max_price}</td>
                                <td className={ipo.gmp_amount >= 0 ? styles.positive : styles.negative}>
                                    ₹{ipo.gmp_amount}
                                </td>
                                <td className={ipo.gmp_percentage >= 0 ? styles.positive : styles.negative}>
                                    {ipo.gmp_percentage >= 0 ? '+' : ''}{ipo.gmp_percentage.toFixed(1)}%
                                </td>
                                <td>{ipo.lot_size}</td>
                                <td>
                                    <strong className={ipo.subscription_total >= 1 ? styles.subscribed : ''}>
                                        {ipo.subscription_total.toFixed(2)}x
                                    </strong>
                                </td>
                                <td>{new Date(ipo.open_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</td>
                                <td>{new Date(ipo.close_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</td>
                                <td>
                                    <Link href={`/ipo/${ipo.slug}`} className={styles.viewButton}>
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

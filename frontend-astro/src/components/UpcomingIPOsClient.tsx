'use client';

import { useEffect, useState, useMemo } from 'react';
import IPOCard from './IPOCard';
import styles from '../styles/upcoming-ipos.module.css';
import { fetchCombinedIPOData } from '../lib/api';
import type { IPOGmp, IPOSubscription } from '../lib/supabase';

type CategoryFilter = 'all' | 'Mainboard' | 'SME';
type StatusKey = 'upcoming' | 'open' | 'closed';

interface IPOWithRelations {
    id: number;
    ipo_name: string;
    company_name: string;
    slug: string;
    category: string;
    status: string;
    open_date: string;
    close_date: string;
    lot_size: number;
    min_price?: number;
    max_price?: number;
    ipo_gmp?: IPOGmp[];
    ipo_subscriptions?: IPOSubscription[];
}

export default function UpcomingIPOsClient() {
    const [allIPOs, setAllIPOs] = useState<IPOWithRelations[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [statusFilters, setStatusFilters] = useState<Set<StatusKey>>(new Set(['upcoming', 'open', 'closed']));
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchCombinedIPOData();
                setAllIPOs(data);
            } catch (error) {
                console.error('Failed to load upcoming IPOs:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Toggle status filter (multi-select)
    const toggleStatusFilter = (status: StatusKey) => {
        const newFilters = new Set(statusFilters);
        if (newFilters.has(status)) {
            if (newFilters.size > 1) {
                newFilters.delete(status);
            }
        } else {
            newFilters.add(status);
        }
        setStatusFilters(newFilters);
    };

    const selectAllStatuses = () => {
        setStatusFilters(new Set(['upcoming', 'open', 'closed']));
    };

    const allStatusesSelected = statusFilters.size === 3;

    const filteredIPOs = useMemo(() => {
        const statusOrder: Record<string, number> = { upcoming: 1, open: 2, closed: 3 };

        return allIPOs
            .filter(ipo => {
                const category = ipo.category || 'Mainboard';
                const status = ipo.status || 'upcoming';
                const openDate = ipo.open_date || '';

                const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
                const matchesStatus = statusFilters.has(status as StatusKey);

                let matchesDate = true;
                if (openDate && (dateFrom || dateTo)) {
                    const ipoDate = new Date(openDate);
                    if (dateFrom) {
                        const fromDate = new Date(dateFrom);
                        if (ipoDate < fromDate) matchesDate = false;
                    }
                    if (dateTo && matchesDate) {
                        const toDate = new Date(dateTo);
                        if (ipoDate > toDate) matchesDate = false;
                    }
                }

                return matchesCategory && matchesStatus && matchesDate;
            })
            .sort((a, b) => {
                const statusA = a.status || 'upcoming';
                const statusB = b.status || 'upcoming';
                return (statusOrder[statusA] || 99) - (statusOrder[statusB] || 99);
            });
    }, [allIPOs, categoryFilter, statusFilters, dateFrom, dateTo]);

    const clearDateFilters = () => {
        setDateFrom('');
        setDateTo('');
    };

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.sectionHeader}>
                    <h1 className={styles.sectionTitle}>Current &amp; Upcoming IPOs</h1>
                    <p className={styles.sectionSubtitle}>Loading IPO data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Current &amp; Upcoming IPOs</h1>
                <p className={styles.sectionSubtitle}>
                    Live tracking of all scheduled IPO launches with detailed information
                </p>
            </div>

            {/* Filters Section */}
            <div className={styles.filtersSection}>
                <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                        <span className={styles.filterLabel}>Category:</span>
                        <div className={styles.filterButtons}>
                            <button
                                className={`${styles.filterBtn} ${categoryFilter === 'all' ? styles.active : ''}`}
                                onClick={() => setCategoryFilter('all')}
                            >
                                All
                            </button>
                            <button
                                className={`${styles.filterBtn} ${categoryFilter === 'Mainboard' ? styles.active : ''}`}
                                onClick={() => setCategoryFilter('Mainboard')}
                            >
                                Mainboard
                            </button>
                            <button
                                className={`${styles.filterBtn} ${categoryFilter === 'SME' ? styles.active : ''}`}
                                onClick={() => setCategoryFilter('SME')}
                            >
                                SME
                            </button>
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <span className={styles.filterLabel}>Status:</span>
                        <div className={styles.filterButtons}>
                            <button
                                className={`${styles.filterBtn} ${allStatusesSelected ? styles.active : ''}`}
                                onClick={selectAllStatuses}
                            >
                                All
                            </button>
                            <button
                                className={`${styles.filterBtn} ${statusFilters.has('upcoming') ? styles.active : ''}`}
                                onClick={() => toggleStatusFilter('upcoming')}
                            >
                                Upcoming
                            </button>
                            <button
                                className={`${styles.filterBtn} ${statusFilters.has('open') ? styles.active : ''}`}
                                onClick={() => toggleStatusFilter('open')}
                            >
                                Open
                            </button>
                            <button
                                className={`${styles.filterBtn} ${statusFilters.has('closed') ? styles.active : ''}`}
                                onClick={() => toggleStatusFilter('closed')}
                            >
                                Closed
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Open Date:</span>
                    <div className={styles.dateFilterWrapper}>
                        <div className={styles.dateRange}>
                            <label className={styles.dateLabel}>From:</label>
                            <input
                                type="date"
                                className={styles.dateInput}
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className={styles.dateRange}>
                            <label className={styles.dateLabel}>To:</label>
                            <input
                                type="date"
                                className={styles.dateInput}
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        {(dateFrom || dateTo) && (
                            <button className={styles.clearDateBtn} onClick={clearDateFilters}>
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.ipoGrid}>
                {filteredIPOs.map((ipo) => (
                    <IPOCard key={ipo.id} ipo={ipo} />
                ))}
            </div>

            {filteredIPOs.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No IPOs match your filters. Try adjusting the filters above.</p>
                </div>
            )}
        </div>
    );
}

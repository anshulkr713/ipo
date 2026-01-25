'use client';

// app/ipo/IPOListingClient.tsx

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';

interface IPO {
    id: number;
    slug: string;
    ipo_name: string;
    company_name: string;
    category: string;
    status: string;
    gmp_amount: number;
    gmp_percentage: number;
    subscription_total: number;
    subscription_retail: number;
    min_price: number;
    max_price: number;
    lot_size: number;
    open_date: string;
    close_date: string;
    listing_date: string | null;
    expert_rating: number;
    expert_recommendation: string;
}

export default function IPOListingClient() {
    const [ipos, setIpos] = useState<IPO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    useEffect(() => {
        fetchIPOs();
    }, []);

    async function fetchIPOs() {
        setLoading(true);
        const { data, error } = await supabase
            .from('ipos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching IPOs:', error);
        } else {
            setIpos(data || []);
        }
        setLoading(false);
    }

    // Filter IPOs
    const filteredIPOs = ipos.filter((ipo) => {
        const matchesSearch =
            ipo.ipo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ipo.company_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'all' || ipo.status === filterStatus;
        const matchesCategory = filterCategory === 'all' || ipo.category === filterCategory;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'TBA';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const today = new Date();
        const statusMap: Record<string, { text: string; color: string }> = {
            open: { text: 'OPEN NOW', color: '#22c55e' },
            upcoming: { text: 'UPCOMING', color: '#ffd700' },
            closed: { text: 'CLOSED', color: '#666666' },
            listed: { text: 'LISTED', color: '#1a1a1a' },
        };
        return statusMap[status.toLowerCase()] || { text: status.toUpperCase(), color: '#666666' };
    };

    return (
        <div className={styles.container}>
            {/* Hero Header */}
            <div className={styles.hero}>
                <h1 className={styles.title}>
                    🔍 Analyse All IPOs
                </h1>
                <p className={styles.subtitle}>
                    Complete analysis of all IPOs with live GMP, subscription status, and expert recommendations
                </p>
            </div>

            {/* Search and Filters */}
            <div className={styles.filterSection}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Search IPOs by company name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filters}>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="closed">Closed</option>
                        <option value="listed">Listed</option>
                    </select>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Categories</option>
                        <option value="Mainboard">Mainboard</option>
                        <option value="SME">SME</option>
                    </select>
                </div>
            </div>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total IPOs</span>
                    <span className={styles.statValue}>{filteredIPOs.length}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Open Now</span>
                    <span className={styles.statValue}>
                        {filteredIPOs.filter((i) => i.status === 'open').length}
                    </span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Upcoming</span>
                    <span className={styles.statValue}>
                        {filteredIPOs.filter((i) => i.status === 'upcoming').length}
                    </span>
                </div>
            </div>

            {/* IPO Grid */}
            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading IPOs...</p>
                </div>
            ) : filteredIPOs.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No IPOs found matching your criteria</p>
                </div>
            ) : (
                <div className={styles.ipoGrid}>
                    {filteredIPOs.map((ipo) => {
                        const statusBadge = getStatusBadge(ipo.status);
                        return (
                            <Link
                                key={ipo.id}
                                href={`/ipo/${ipo.slug}`}
                                className={styles.ipoCard}
                            >
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h3 className={styles.ipoName}>{ipo.company_name}</h3>
                                        <p className={styles.category}>{ipo.category}</p>
                                    </div>
                                    <div
                                        className={styles.statusBadge}
                                        style={{ background: statusBadge.color }}
                                    >
                                        {statusBadge.text}
                                    </div>
                                </div>

                                <div className={styles.cardMetrics}>
                                    <div className={styles.metric}>
                                        <span className={styles.metricLabel}>GMP</span>
                                        <span className={styles.metricValue}>
                                            ₹{ipo.gmp_amount} <span className={styles.metricChange}>+{ipo.gmp_percentage}%</span>
                                        </span>
                                    </div>

                                    <div className={styles.metric}>
                                        <span className={styles.metricLabel}>Subscription</span>
                                        <span className={styles.metricValue}>{ipo.subscription_total.toFixed(2)}x</span>
                                    </div>

                                    <div className={styles.metric}>
                                        <span className={styles.metricLabel}>Price Band</span>
                                        <span className={styles.metricValue}>
                                            ₹{ipo.min_price} - ₹{ipo.max_price}
                                        </span>
                                    </div>

                                    <div className={styles.metric}>
                                        <span className={styles.metricLabel}>Min Investment</span>
                                        <span className={styles.metricValue}>
                                            ₹{(ipo.max_price * ipo.lot_size).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.cardDates}>
                                    <div className={styles.dateItem}>
                                        <span className={styles.dateLabel}>Open</span>
                                        <span className={styles.dateValue}>{formatDate(ipo.open_date)}</span>
                                    </div>
                                    <span className={styles.dateArrow}>→</span>
                                    <div className={styles.dateItem}>
                                        <span className={styles.dateLabel}>Close</span>
                                        <span className={styles.dateValue}>{formatDate(ipo.close_date)}</span>
                                    </div>
                                </div>

                                {ipo.expert_recommendation && (
                                    <div className={styles.cardFooter}>
                                        <span className={styles.recommendation}>
                                            {'⭐'.repeat(Math.round(ipo.expert_rating || 0))} {ipo.expert_recommendation}
                                        </span>
                                    </div>
                                )}

                                <div className={styles.cardCTA}>
                                    View Full Analysis →
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
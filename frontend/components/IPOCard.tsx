'use client';

import Link from 'next/link';
import styles from './IPOCard.module.css';
import type { IPOGmp, IPOSubscription } from '../lib/supabase';

export interface IPOData {
  id: number;
  ipo_name: string;
  company_name: string;
  slug: string;
  status: 'upcoming' | 'open' | 'closed' | 'listed' | 'withdrawn';
  open_date: string;
  close_date: string;
  min_price?: number;
  max_price?: number;
  lot_size: number;
  issue_size_cr?: number;
  listing_date?: string;
  parent_company?: string;
  category: 'SME' | 'Mainboard';
  drhp_status?: 'filed' | 'pending' | 'approved';
  rhp_status?: 'filed' | 'pending' | 'approved';
  ipo_gmp?: IPOGmp[];
  ipo_subscriptions?: IPOSubscription[];
}

interface IPOCardProps {
  ipo: any;
}

export default function IPOCard({ ipo }: IPOCardProps) {
  // Handle both old and new field names for backwards compatibility
  const name = ipo.company_name || ipo.ipo_name || ipo.name || '';
  const category = ipo.category || 'Mainboard';
  const status = ipo.status || 'upcoming';
  const openDate = ipo.open_date || ipo.openDate || 'TBA';
  const closeDate = ipo.close_date || ipo.closeDate || 'TBA';

  // Build price range from new schema fields
  const minPrice = ipo.min_price || ipo.minPrice;
  const maxPrice = ipo.max_price || ipo.maxPrice;
  const priceRange = minPrice && maxPrice
    ? `₹${minPrice} - ₹${maxPrice}`
    : (ipo.priceRange || ipo.price_range || 'TBA');

  // Handle issue size from new schema (in crores)
  const issueSizeCr = ipo.issue_size_cr || ipo.issueSizeCr;
  const issueSize = issueSizeCr
    ? `₹${issueSizeCr} Cr`
    : (ipo.issueSize || ipo.issue_size || 'TBA');

  // Use slug directly from data
  const slug = ipo.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-ipo';

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'TBA') return 'TBA';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <Link href={`/ipo/${slug}`} className={styles.ipoCardLink}>
      <div className={styles.ipoCard}>
        <div className={styles.ipoHeader}>
          <div>
            <h3 className={styles.ipoName}>{name}</h3>
            <p className={styles.ipoCategory}>{category}</p>
          </div>
          <span className={`${styles.ipoStatus} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}>
            {status}
          </span>
        </div>

        <div className={styles.ipoDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Open Date</span>
            <span className={styles.detailValue}>{formatDate(openDate)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Close Date</span>
            <span className={styles.detailValue}>{formatDate(closeDate)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Price Range</span>
            <span className={styles.detailValue}>{priceRange}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Issue Size</span>
            <span className={styles.detailValue}>{issueSize}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

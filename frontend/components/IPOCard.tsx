'use client';

import { useState } from 'react';
import styles from './IPOCard.module.css';
import IPOModal from './IPOModal';

export interface IPOData {
  id: number;
  name: string;
  status: 'upcoming' | 'open' | 'closed';
  openDate: string;
  closeDate: string;
  priceRange: string;
  lotSize: string;
  issueSize: string;
  listingDate: string;
  parentCompany: string;
  category: string;
  drhp: 'filed' | 'pending';
  rhp: 'filed' | 'pending';
  gmp?: number;
  expectedListing?: string;
}

interface IPOCardProps {
  ipo: any;
}

export default function IPOCard({ ipo }: IPOCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle both camelCase (old) and snake_case (database) field names
  const name = ipo.name || ipo.company_name || ipo.ipo_name || '';
  const category = ipo.category || 'Mainboard';
  const status = ipo.status || 'upcoming';
  const openDate = ipo.openDate || ipo.open_date || '-';
  const closeDate = ipo.closeDate || ipo.close_date || '-';
  const priceRange = ipo.priceRange || ipo.price_range || '-';
  const issueSize = ipo.issueSize || ipo.issue_size || '-';

  return (
    <>
      <div className={styles.ipoCard} onClick={() => setIsModalOpen(true)}>
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
            <span className={styles.detailValue}>{openDate}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Close Date</span>
            <span className={styles.detailValue}>{closeDate}</span>
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

      {isModalOpen && (
        <IPOModal ipo={ipo} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

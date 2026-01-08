'use client';

import { useEffect } from 'react';
import styles from './IPOModal.module.css';
import { IPOData } from './IPOCard';

interface IPOModalProps {
  ipo: IPOData;
  onClose: () => void;
}

export default function IPOModal({ ipo, onClose }: IPOModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modal} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <button className={styles.modalClose} onClick={onClose}>
          &times;
        </button>

        <h2 className={styles.modalTitle}>{ipo.name}</h2>
        <p className={styles.modalCategory}>{ipo.category}</p>

        <div className={styles.modalDetails}>
          <div className={styles.modalDetailGroup}>
            <h3 className={styles.groupTitle}>Issue Details</h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Open Date</span>
              <span className={styles.detailValue}>{ipo.openDate}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Close Date</span>
              <span className={styles.detailValue}>{ipo.closeDate}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Listing Date</span>
              <span className={styles.detailValue}>{ipo.listingDate}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Price Range</span>
              <span className={styles.detailValue}>{ipo.priceRange}</span>
            </div>
          </div>

          <div className={styles.modalDetailGroup}>
            <h3 className={styles.groupTitle}>Investment Info</h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Lot Size</span>
              <span className={styles.detailValue}>{ipo.lotSize}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Issue Size</span>
              <span className={styles.detailValue}>{ipo.issueSize}</span>
            </div>
            {ipo.gmp && (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>GMP</span>
                  <span className={styles.detailValue}>₹{ipo.gmp}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Expected Listing</span>
                  <span className={styles.detailValue}>{ipo.expectedListing}</span>
                </div>
              </>
            )}
          </div>

          <div className={styles.modalDetailGroup}>
            <h3 className={styles.groupTitle}>Company Info</h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Parent Company</span>
              <span className={styles.detailValue}>{ipo.parentCompany}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Category</span>
              <span className={styles.detailValue}>{ipo.category}</span>
            </div>
          </div>

          <div className={styles.modalDetailGroup}>
            <h3 className={styles.groupTitle}>Regulatory Filings</h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>DRHP Status</span>
              <span className={`${styles.badge} ${ipo.drhp === 'filed' ? styles.badgeFiled : styles.badgePending}`}>
                {ipo.drhp}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>RHP Status</span>
              <span className={`${styles.badge} ${ipo.rhp === 'filed' ? styles.badgeFiled : styles.badgePending}`}>
                {ipo.rhp}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

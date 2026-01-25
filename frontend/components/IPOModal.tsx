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

  // Handle both new and legacy field names
  const name = ipo.company_name || ipo.ipo_name || '';
  const openDate = ipo.open_date || 'TBA';
  const closeDate = ipo.close_date || 'TBA';
  const listingDate = ipo.listing_date || 'TBA';
  const minPrice = ipo.min_price || 0;
  const maxPrice = ipo.max_price || 0;
  const priceRange = minPrice && maxPrice ? `₹${minPrice} - ₹${maxPrice}` : 'TBA';
  const lotSize = ipo.lot_size ? `${ipo.lot_size} shares` : 'TBA';
  const issueSize = ipo.issue_size_cr ? `₹${ipo.issue_size_cr} Cr` : 'TBA';
  const parentCompany = ipo.parent_company || 'N/A';
  const drhpStatus = ipo.drhp_status || 'pending';
  const rhpStatus = ipo.rhp_status || 'pending';

  // Extract GMP from nested array if available
  const latestGmp = ipo.ipo_gmp?.find(g => g.is_latest) || ipo.ipo_gmp?.[0];
  const gmp = latestGmp?.gmp_amount;
  const expectedListing = latestGmp?.estimated_listing_price ? `₹${latestGmp.estimated_listing_price}` : 'N/A';

  // Format date for display
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr || dateStr === 'TBA') return 'TBA';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.modal} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <button className={styles.modalClose} onClick={onClose}>
          &times;
        </button>

        <h2 className={styles.modalTitle}>{name}</h2>
        <p className={styles.modalCategory}>{ipo.category}</p>

        <div className={styles.modalDetails}>
          <div className={styles.modalDetailGroup}>
            <h3 className={styles.groupTitle}>Issue Details</h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Open Date</span>
              <span className={styles.detailValue}>{formatDate(openDate)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Close Date</span>
              <span className={styles.detailValue}>{formatDate(closeDate)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Listing Date</span>
              <span className={styles.detailValue}>{formatDate(listingDate)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Price Range</span>
              <span className={styles.detailValue}>{priceRange}</span>
            </div>
          </div>

          <div className={styles.modalDetailGroup}>
            <h3 className={styles.groupTitle}>Investment Info</h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Lot Size</span>
              <span className={styles.detailValue}>{lotSize}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Issue Size</span>
              <span className={styles.detailValue}>{issueSize}</span>
            </div>
            {gmp !== undefined && (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>GMP</span>
                  <span className={styles.detailValue}>₹{gmp}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Expected Listing</span>
                  <span className={styles.detailValue}>{expectedListing}</span>
                </div>
              </>
            )}
          </div>

          <div className={styles.modalDetailGroup}>
            <h3 className={styles.groupTitle}>Company Info</h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Parent Company</span>
              <span className={styles.detailValue}>{parentCompany}</span>
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
              <span className={`${styles.badge} ${drhpStatus === 'filed' || drhpStatus === 'approved' ? styles.badgeFiled : styles.badgePending}`}>
                {drhpStatus}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>RHP Status</span>
              <span className={`${styles.badge} ${rhpStatus === 'filed' || rhpStatus === 'approved' ? styles.badgeFiled : styles.badgePending}`}>
                {rhpStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

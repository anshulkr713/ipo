'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { fetchShareholderData } from '@/lib/api';

interface ShareholderData {
  id: number;
  ipo_name: string;
  parent_company: string | null;
  category: string | null;
  drhp_status: string | null;
  rhp_status: string | null;
  issue_size_cr: string | null;
}

export default function Shareholders() {
  const [shareholderData, setShareholderData] = useState<ShareholderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchShareholderData();
        setShareholderData(data);
      } catch (error) {
        console.error('Failed to load shareholder data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>IPO Shareholder Analysis</h1>
        <p className={styles.sectionSubtitle}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>IPO Shareholder Analysis</h1>
        <p className={styles.sectionSubtitle}>
          Track parent companies, shareholder categories, and regulatory filings
        </p>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Parent Company</th>
              <th>Category</th>
              <th>DRHP Status</th>
              <th>RHP Status</th>
              <th>Issue Size</th>
            </tr>
          </thead>
          <tbody>
            {shareholderData.map((row) => (
              <tr key={row.id}>
                <td className={styles.companyName}>{row.ipo_name}</td>
                <td>{row.parent_company || '-'}</td>
                <td>
                  {row.category ? (
                    <span className={styles.categoryBadge}>{row.category}</span>
                  ) : '-'}
                </td>
                <td>
                  {row.drhp_status ? (
                    <span className={`${styles.badge} ${row.drhp_status === 'filed' ? styles.badgeFiled : styles.badgePending}`}>
                      {row.drhp_status}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  {row.rhp_status ? (
                    <span className={`${styles.badge} ${row.rhp_status === 'filed' ? styles.badgeFiled : styles.badgePending}`}>
                      {row.rhp_status}
                    </span>
                  ) : '-'}
                </td>
                <td className={styles.issueSize}>{row.issue_size_cr ? `₹${row.issue_size_cr} Cr` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shareholderData.length === 0 && (
        <div className={styles.emptyState}>
          <p>No shareholder data available at the moment.</p>
        </div>
      )}
    </>
  );
}
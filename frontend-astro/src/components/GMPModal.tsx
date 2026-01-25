'use client';

import { useEffect } from 'react';
import styles from './GMPModal.module.css';

interface DayWiseData {
    date: string;
    day: number;
    qibExAnchor?: number;
    nii?: number;
    bNII?: number;
    sNII?: number;
    retail?: number;
    total?: number;
}

interface SubscriptionData {
    anchorInvestors?: number;
    qibExAnchor?: number;
    nonInstitutional?: number;
    bNII?: number;
    sNII?: number;
    retail?: number;
    employee?: number;
    shareholder?: number;
    total?: number;
    dayWise?: DayWiseData[];
}

interface IPOData {
    id: number;
    companyName: string;
    category: string;
    gmp: number;
    percentage: number;
    issuePrice: string;
    expectedListing: string;
    lotSize: string;
    listingDate: string;
    subscription?: SubscriptionData;
}

interface GMPModalProps {
    ipo: IPOData;
    onClose: () => void;
}

export default function GMPModal({ ipo, onClose }: GMPModalProps) {
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

    // Extract numeric values
    const issuePrice = parseInt(ipo.issuePrice.replace(/[^0-9]/g, ''));
    const lotSizeNum = parseInt(ipo.lotSize.split(' ')[0]);

    // Calculate lot values and profits
    const retailLotValue = issuePrice * lotSizeNum;
    const sNIILotValue = issuePrice * lotSizeNum;
    const bNIILotValue = issuePrice * lotSizeNum;

    const retailProfit = ipo.gmp * lotSizeNum;
    const sNIIProfit = ipo.gmp * lotSizeNum;
    const bNIIProfit = ipo.gmp * lotSizeNum;

    const retailFinal = retailLotValue + retailProfit;
    const sNIIFinal = sNIILotValue + sNIIProfit;
    const bNIIFinal = bNIILotValue + bNIIProfit;

    const subscription = ipo.subscription || {
        retail: 0,
        total: 0
    };

    return (
        <div className={styles.modal} onClick={handleBackdropClick}>
            <div className={styles.modalContent}>
                <button className={styles.modalClose} onClick={onClose}>
                    &times;
                </button>

                <h2 className={styles.modalTitle}>{ipo.companyName}</h2>
                <p className={styles.modalSubtitle}>Live Subscription Status</p>

                {/* Day-wise Subscription Table */}
                {subscription.dayWise && subscription.dayWise.length > 0 && (
                    <div className={styles.dayWiseSection}>
                        <h3 className={styles.sectionTitle}>📈 Day-wise Subscription Details</h3>
                        <div className={styles.dayWiseTable}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>QIB (Ex Anchor)</th>
                                        <th>NII</th>
                                        <th>NII (&gt; ₹10L)</th>
                                        <th>NII (&lt; ₹10L)</th>
                                        <th>Retail</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscription.dayWise.map((day, index) => (
                                        <tr key={index} className={index === subscription.dayWise!.length - 1 ? styles.latestDay : ''}>
                                            <td className={styles.dateCell}>
                                                <div className={styles.dateInfo}>
                                                    <span className={styles.date}>{day.date}</span>
                                                    <span className={styles.dayLabel}>Day {day.day}</span>
                                                </div>
                                            </td>
                                            <td className={styles.subscriptionValue}>{day.qibExAnchor?.toFixed(2) || '-'}</td>
                                            <td className={styles.subscriptionValue}>{day.nii?.toFixed(2) || '-'}</td>
                                            <td className={styles.subscriptionValue}>{day.bNII?.toFixed(2) || '-'}</td>
                                            <td className={styles.subscriptionValue}>{day.sNII?.toFixed(2) || '-'}</td>
                                            <td className={`${styles.subscriptionValue} ${styles.highlightRetail}`}>{day.retail?.toFixed(2) || '-'}</td>
                                            <td className={`${styles.subscriptionValue} ${styles.highlightTotal}`}><strong>{day.total?.toFixed(2) || '-'}</strong></td>
                                        </tr>
                                    ))}
                                    <tr className={styles.totalRow}>
                                        <td><strong>Overall Total</strong></td>
                                        <td className={styles.subscriptionValue}><strong>{subscription.qibExAnchor?.toFixed(2) || '-'}</strong></td>
                                        <td className={styles.subscriptionValue}><strong>{subscription.nonInstitutional?.toFixed(2) || '-'}</strong></td>
                                        <td className={styles.subscriptionValue}><strong>{subscription.bNII?.toFixed(2) || '-'}</strong></td>
                                        <td className={styles.subscriptionValue}><strong>{subscription.sNII?.toFixed(2) || '-'}</strong></td>
                                        <td className={`${styles.subscriptionValue} ${styles.highlightRetail}`}><strong>{subscription.retail?.toFixed(2) || '-'}</strong></td>
                                        <td className={`${styles.subscriptionValue} ${styles.highlightTotal}`}><strong>{subscription.total?.toFixed(2) || '-'}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Profit/Loss Calculations */}
                <div className={styles.calculationsSection}>
                    <h3 className={styles.sectionTitle}>Lot Size & Profit Analysis</h3>

                    <div className={styles.calculationCard}>
                        <h4 className={styles.categoryLabel}>Retail Investors</h4>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Lot Size:</span>
                            <span className={styles.calcValue}>{lotSizeNum} shares</span>
                        </div>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Number of Lots:</span>
                            <span className={styles.calcValue}>1 lot</span>
                        </div>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Lot Value:</span>
                            <span className={styles.calcValue}>₹{retailLotValue.toLocaleString()}</span>
                        </div>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Profit/Loss:</span>
                            <span className={`${styles.calcValue} ${retailProfit >= 0 ? styles.profit : styles.loss}`}>
                                {retailProfit >= 0 ? '+' : ''}₹{retailProfit.toLocaleString()}
                            </span>
                        </div>
                        <div className={`${styles.calcRow} ${styles.finalRow}`}>
                            <span className={styles.calcLabel}><strong>Final Value:</strong></span>
                            <span className={styles.calcValue}><strong>₹{retailFinal.toLocaleString()}</strong></span>
                        </div>
                    </div>

                    <div className={styles.calculationCard}>
                        <h4 className={styles.categoryLabel}>sNII (bids below ₹10L)</h4>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Lot Size:</span>
                            <span className={styles.calcValue}>{lotSizeNum} shares</span>
                        </div>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Number of Lots:</span>
                            <span className={styles.calcValue}>2 lots</span>
                        </div>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Lot Value:</span>
                            <span className={styles.calcValue}>₹{sNIILotValue.toLocaleString()}</span>
                        </div>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Profit/Loss:</span>
                            <span className={`${styles.calcValue} ${sNIIProfit >= 0 ? styles.profit : styles.loss}`}>
                                {sNIIProfit >= 0 ? '+' : ''}₹{sNIIProfit.toLocaleString()}
                            </span>
                        </div>
                        <div className={`${styles.calcRow} ${styles.finalRow}`}>
                            <span className={styles.calcLabel}><strong>Final Value:</strong></span>
                            <span className={styles.calcValue}><strong>₹{sNIIFinal.toLocaleString()}</strong></span>
                        </div>
                    </div>

                    <div className={styles.calculationCard}>
                        <h4 className={styles.categoryLabel}>bNII (bids above ₹10L)</h4>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Lot Size:</span>
                            <span className={styles.calcValue}>{lotSizeNum} shares</span>
                        </div>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Number of Lots:</span>
                            <span className={styles.calcValue}>2 lots</span>
                        </div>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Lot Value:</span>
                            <span className={styles.calcValue}>₹{bNIILotValue.toLocaleString()}</span>
                        </div>
                        <div className={styles.calcRow}>
                            <span className={styles.calcLabel}>Profit/Loss:</span>
                            <span className={`${styles.calcValue} ${bNIIProfit >= 0 ? styles.profit : styles.loss}`}>
                                {bNIIProfit >= 0 ? '+' : ''}₹{bNIIProfit.toLocaleString()}
                            </span>
                        </div>
                        <div className={`${styles.calcRow} ${styles.finalRow}`}>
                            <span className={styles.calcLabel}><strong>Final Value:</strong></span>
                            <span className={styles.calcValue}><strong>₹{bNIIFinal.toLocaleString()}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import styles from './IPODetailEnhanced.module.css';

export default function StickyFooter({ companyName, status, minInvestment }: any) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isVisible) return null;

    return (
        <div className={styles.stickyBar}>
            <div className={styles.stickyContent}>
                <div className={styles.stickyInfo}>
                    <span className={styles.stickyTitle}>{companyName}</span>
                    <span className={`${styles.stickyStatus} ${status === 'open' ? styles.statusOpen : ''}`}>
                        {status.toUpperCase()}
                    </span>
                    {minInvestment && (
                        <span className={styles.stickyInvest}>
                            Min: ₹{minInvestment.toLocaleString('en-IN')}
                        </span>
                    )}
                </div>
                <div className={styles.stickyActions}>
                    <button className={styles.cleanBtn} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        ↑ Top
                    </button>
                    <a href="#gmp-chart" className={styles.actionBtn}>
                        Check GMP
                    </a>
                </div>
            </div>
        </div>
    );
}

'use client';

import styles from './QuickActionButtons.module.css';

export default function QuickActionButtons() {
    const actions = [
        {
            title: 'Check Allotment',
            description: 'View IPO allotment status',
            icon: '🎯',
            href: '/allotment',
            color: '#22c55e'
        },
        {
            title: 'Open IPOs',
            description: 'Currently open for bidding',
            icon: '📊',
            href: '/upcoming-ipos',
            color: '#06b6d4'
        },
        {
            title: 'GMP Tracker',
            description: 'Live grey market premium',
            icon: '💹',
            href: '/gmp',
            color: '#a855f7'
        }
    ];

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Quick Actions</h3>
            <div className={styles.buttonsGrid}>
                {actions.map((action, index) => (
                    <a
                        key={index}
                        href={action.href}
                        className={styles.actionButton}
                        style={{
                            '--button-color': action.color
                        } as React.CSSProperties}
                    >
                        <span className={styles.icon}>{action.icon}</span>
                        <div className={styles.content}>
                            <h4 className={styles.actionTitle}>{action.title}</h4>
                            <p className={styles.actionDesc}>{action.description}</p>
                        </div>
                        <span className={styles.arrow}>→</span>
                    </a>
                ))}
            </div>
        </div>
    );
}

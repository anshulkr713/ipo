import styles from './IPODetailEnhanced.module.css';

export default function IPOReservationsTable({ reservations }: any) {
    if (!reservations || reservations.length === 0) return null;

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📊 IPO Reservation / Quota</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Category</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Share Quota %</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Shares Offered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map((res: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 700, color: '#1a3a3a' }}>{res.category}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                    {res.reserved_percentage ? `${res.reserved_percentage}%` : '-'}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                                    {res.reserved_shares ? res.reserved_shares.toLocaleString('en-IN') : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

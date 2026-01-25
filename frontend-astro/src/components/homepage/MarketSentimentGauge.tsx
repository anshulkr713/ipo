'use client';

import styles from './MarketSentimentGauge.module.css';

interface MarketSentimentProps {
    overall_sentiment: 'Bullish' | 'Neutral' | 'Bearish';
    sentiment_score: number;
    avg_gmp_mainboard: number;
    avg_gmp_sme: number;
    positive_gmp_count: number;
    total_open_ipos: number;
}

export default function MarketSentimentGauge({ data }: { data: MarketSentimentProps | null }) {
    if (!data) {
        return (
            <div className={styles.gauge}>
                <h3 className={styles.title}>📊 Market Sentiment</h3>
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading market data...</p>
                </div>
            </div>
        );
    }

    const { overall_sentiment, sentiment_score, avg_gmp_mainboard, avg_gmp_sme, positive_gmp_count, total_open_ipos } = data;

    const getSentimentColor = () => {
        if (overall_sentiment === 'Bullish') return '#22c55e';
        if (overall_sentiment === 'Bearish') return '#ef4444';
        return '#f59e0b';
    };

    const getSentimentIcon = () => {
        if (overall_sentiment === 'Bullish') return '📈';
        if (overall_sentiment === 'Bearish') return '📉';
        return '➖';
    };

    const needleRotation = (sentiment_score / 100) * 180 - 90;

    return (
        <div className={styles.gauge}>
            <h3 className={styles.title}>📊 Market Sentiment</h3>

            <div className={styles.gaugeVisual}>
                <svg viewBox="0 0 200 110" className={styles.gaugeSvg}>
                    {/* Background arcs */}
                    <path
                        d="M 20 90 A 70 70 0 0 1 180 90"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="15"
                        strokeLinecap="round"
                        opacity="0.2"
                    />
                    <path
                        d="M 20 90 A 70 70 0 0 1 180 90"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="15"
                        strokeLinecap="round"
                        strokeDasharray="110 330"
                        strokeDashoffset="0"
                        opacity="0.2"
                    />
                    <path
                        d="M 20 90 A 70 70 0 0 1 180 90"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="15"
                        strokeLinecap="round"
                        strokeDasharray="110 330"
                        strokeDashoffset="-220"
                        opacity="0.2"
                    />

                    {/* Active arc */}
                    <path
                        d="M 20 90 A 70 70 0 0 1 180 90"
                        fill="none"
                        stroke={getSentimentColor()}
                        strokeWidth="15"
                        strokeLinecap="round"
                        strokeDasharray={`${(sentiment_score / 100) * 220} 220`}
                        className={styles.gaugeFill}
                    />

                    {/* Needle */}
                    <line
                        x1="100"
                        y1="90"
                        x2="100"
                        y2="35"
                        stroke={getSentimentColor()}
                        strokeWidth="3"
                        strokeLinecap="round"
                        transform={`rotate(${needleRotation} 100 90)`}
                        className={styles.needle}
                    />
                    <circle cx="100" cy="90" r="6" fill={getSentimentColor()} />
                    <circle cx="100" cy="90" r="3" fill="#0a0e27" />
                </svg>
            </div>

            <div className={styles.sentimentLabel} style={{ color: getSentimentColor() }}>
                <span className={styles.icon}>{getSentimentIcon()}</span>
                <span className={styles.text}>{overall_sentiment}</span>
                <span className={styles.score}>{sentiment_score.toFixed(0)}/100</span>
            </div>

            <div className={styles.stats}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Mainboard GMP</span>
                    <span className={styles.statValue}>+{avg_gmp_mainboard.toFixed(1)}%</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>SME GMP</span>
                    <span className={styles.statValue}>+{avg_gmp_sme.toFixed(1)}%</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Positive IPOs</span>
                    <span className={styles.statValue}>{positive_gmp_count}/{total_open_ipos}</span>
                </div>
            </div>
        </div>
    );
}

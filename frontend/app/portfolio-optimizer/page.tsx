import type { Metadata } from 'next';
import PortfolioOptimizerClient from './PortfolioOptimizerClient';

export const metadata: Metadata = {
    title: 'IPO Portfolio Optimizer - Maximize Your Returns',
    description: 'Optimize your IPO investments with our AI-powered portfolio optimizer. Get personalized strategies based on your capital and risk appetite. Maximize allotment chances across multiple accounts.',
    keywords: ['IPO portfolio', 'IPO optimizer', 'IPO investment strategy', 'IPO returns', 'IPO allotment probability', 'multi-account IPO'],
    openGraph: {
        title: 'IPO Portfolio Optimizer - Maximize Your Returns',
        description: 'Optimize your IPO investments with AI-powered strategies. Maximize allotment chances and returns.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'IPO Portfolio Optimizer - Maximize Your Returns',
        description: 'Optimize your IPO investments with AI-powered strategies.',
    },
};

export const revalidate = 3600; // Revalidate every 1 hour

export default function PortfolioOptimizerPage() {
    return <PortfolioOptimizerClient />;
}

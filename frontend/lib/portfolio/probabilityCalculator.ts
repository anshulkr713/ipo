// probabilityCalculator.ts - Core probability calculation logic

import { IPO, ApplicationCategory, MarketType, CategoryRequirements } from './types';

/**
 * Calculate allotment probability for a specific IPO category
 */
export function calculateAllotmentProbability(
    ipo: IPO,
    category: ApplicationCategory,
    marketType: MarketType
): number {
    const subscription = getSubscriptionForCategory(ipo, category, marketType);

    // If no subscription data or undersubscribed, assume 100% probability
    if (subscription === 0 || subscription === null) return 100;
    if (subscription < 1) return 100;

    // Base probability (inverse of subscription)
    let baseProbability = Math.min(100, (1 / subscription) * 100);

    // Category-specific multipliers based on historical allotment patterns
    const categoryMultipliers: Record<MarketType, Record<ApplicationCategory, number>> = {
        mainboard: {
            retail: 1.0,    // Retail gets standard allocation
            shni: 0.85,     // sHNI slightly lower due to higher competition
            bhni: 0.75      // bHNI much lower due to concentrated applications
        },
        sme: {
            retail: 1.15,   // SME retail often has better odds
            shni: 0.90,     // SME sHNI moderate
            bhni: 0.80      // SME bHNI competitive
        }
    };

    const multiplier = categoryMultipliers[marketType]?.[category] ?? 1.0;
    let probability = baseProbability * multiplier;

    // Oversubscription penalty (heavily oversubscribed = lower chance)
    if (subscription > 50) {
        probability *= 0.85; // Additional 15% reduction for super-hot IPOs
    } else if (subscription > 100) {
        probability *= 0.70; // 30% reduction for extremely oversubscribed
    }

    // Ensure probability is within bounds
    return Math.min(100, Math.max(0.1, probability));
}

/**
 * Get subscription rate for specific category
 */
export function getSubscriptionForCategory(
    ipo: IPO,
    category: ApplicationCategory,
    marketType: MarketType
): number {
    const subscriptionMap: Record<ApplicationCategory, number> = {
        retail: ipo.subscription_retail || 0,
        shni: ipo.subscription_nii || 0,  // NII = Non-Institutional Investors (sHNI)
        bhni: ipo.subscription_bnii || 0  // bNII = Big Non-Institutional Investors (bHNI)
    };

    return subscriptionMap[category];
}

/**
 * NEW: Determine shareholder allotment mode (PRO_RATA vs LOTTERY)
 * 
 * Logic:
 * - Calculate Capacity = shares_offered_shareholder / lot_size
 * - IF applications_count_shareholder < Capacity → PRO_RATA (guaranteed allotment)
 * - ELSE → LOTTERY (normal lottery system)
 * - Defaults to LOTTERY if data is missing
 */
export function getShareholderAllotmentMode(ipo: IPO): 'PRO_RATA' | 'LOTTERY' {
    // Handle null/undefined values - default to LOTTERY
    if (!ipo.has_shareholder_quota) {
        return 'LOTTERY';
    }

    if (
        ipo.shares_offered_shareholder == null ||
        ipo.shares_offered_shareholder === 0 ||
        ipo.applications_count_shareholder == null ||
        ipo.lot_size == null ||
        ipo.lot_size === 0
    ) {
        return 'LOTTERY';
    }

    // Calculate capacity
    const capacity = ipo.shares_offered_shareholder / ipo.lot_size;

    // If applications are less than capacity, it's PRO_RATA (guaranteed)
    if (ipo.applications_count_shareholder < capacity) {
        return 'PRO_RATA';
    }

    // Otherwise, it's a lottery
    return 'LOTTERY';
}

/**
 * Calculate expected number of lots that will be allotted
 */
export function calculateExpectedLots(
    appliedLots: number,
    probability: number
): number {
    // In lottery system, probability applies per application
    // Expected lots = Applied lots × Probability
    return (appliedLots * probability) / 100;
}

/**
 * Calculate expected profit from an application
 */
export function calculateExpectedProfit(
    ipo: IPO,
    category: ApplicationCategory,
    appliedLots: number,
    probability: number
): number {
    const profitPerLot = ipo.gmp_amount * ipo.lot_size;
    const expectedLots = calculateExpectedLots(appliedLots, probability);
    return expectedLots * profitPerLot;
}

/**
 * Get minimum and maximum lot requirements for a category
 * Uses actual IPO data if available, otherwise defaults
 */
export function getCategoryRequirements(
    ipo: IPO,
    category: ApplicationCategory
): CategoryRequirements {
    const costPerLot = ipo.max_price * ipo.lot_size;
    const marketType = ipo.category.toLowerCase() as MarketType;

    // Try to use IPO-specific limits first
    if (category === 'retail') {
        const minLots = ipo.retail_min_lots ?? 1;
        const maxLots = ipo.retail_max_lots ?? (marketType === 'mainboard' ? 13 : 10);

        return {
            minLots,
            maxLots,
            minInvestment: costPerLot * minLots
        };
    }

    if (category === 'shni') {
        const minLots = ipo.shni_min_lots ?? 2;
        const maxLots = ipo.shni_max_lots ?? (marketType === 'mainboard' ? 14 : 20);

        return {
            minLots,
            maxLots,
            minInvestment: costPerLot * minLots
        };
    }

    if (category === 'bhni') {
        const minLots = ipo.bhni_min_lots ?? (marketType === 'mainboard' ? 10 : 5);
        const maxLots = 1000; // Usually no upper limit for bHNI

        return {
            minLots,
            maxLots,
            minInvestment: costPerLot * minLots
        };
    }

    // Fallback
    return {
        minLots: 1,
        maxLots: 10,
        minInvestment: costPerLot
    };
}

/**
 * Calculate ROI (Return on Investment) percentage
 */
export function calculateROI(
    expectedProfit: number,
    investment: number
): number {
    if (investment === 0) return 0;
    return (expectedProfit / investment) * 100;
}

/**
 * Calculate a composite score for ranking applications
 * Score = (Probability × Weight1) + (ROI × Weight2) + (GMP% × Weight3)
 */
export function calculateApplicationScore(
    probability: number,
    roi: number,
    gmpPercentage: number,
    preferProbability: boolean = true
): number {
    // If preferProbability is true, weight probability more heavily
    const weights = preferProbability
        ? { probability: 0.5, roi: 0.3, gmp: 0.2 }
        : { probability: 0.3, roi: 0.4, gmp: 0.3 };

    return (
        (probability * weights.probability) +
        (Math.min(roi, 100) * weights.roi) +  // Cap ROI at 100 for scoring
        (Math.min(gmpPercentage, 100) * weights.gmp)
    );
}

/**
 * Calculate risk score based on diversification and probability
 */
export function calculateRiskScore(
    numApplications: number,
    avgProbability: number,
    totalInvestment: number
): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskPoints = 0;

    // Factor 1: Diversification (more apps = lower risk)
    if (numApplications >= 4) riskPoints += 3;
    else if (numApplications >= 2) riskPoints += 2;
    else riskPoints += 0;

    // Factor 2: Average probability (higher = lower risk)
    if (avgProbability >= 70) riskPoints += 3;
    else if (avgProbability >= 50) riskPoints += 2;
    else if (avgProbability >= 30) riskPoints += 1;
    else riskPoints += 0;

    // Factor 3: Capital concentration (spreading = lower risk)
    const maxAppCost = totalInvestment / numApplications;
    if (maxAppCost < totalInvestment * 0.4) riskPoints += 2;
    else if (maxAppCost < totalInvestment * 0.6) riskPoints += 1;

    // Determine risk level
    if (riskPoints >= 7) return 'LOW';
    if (riskPoints >= 4) return 'MEDIUM';
    return 'HIGH';
}

/**
 * Calculate weighted probability across multiple applications
 * Accounts for the fact that getting at least one allocation is more likely
 */
export function calculateWeightedProbability(probabilities: number[]): number {
    if (probabilities.length === 0) return 0;
    if (probabilities.length === 1) return probabilities[0];

    // Calculate probability of getting at least one allotment
    // P(at least one) = 1 - P(none)
    // P(none) = (1-p1) × (1-p2) × ... × (1-pn)
    const probNone = probabilities.reduce(
        (product, prob) => product * (1 - prob / 100),
        1
    );

    return (1 - probNone) * 100;
}

/**
 * Determine if capital is sufficient for an application
 */
export function canAfford(
    capital: number,
    ipo: IPO,
    category: ApplicationCategory,
    numLots: number = 1
): boolean {
    const costPerLot = ipo.max_price * ipo.lot_size;
    const totalCost = costPerLot * numLots;
    const requirements = getCategoryRequirements(ipo, category);

    return (
        capital >= totalCost &&
        numLots >= requirements.minLots &&
        numLots <= requirements.maxLots
    );
}

/**
 * Get optimal number of lots for given capital and category
 */
export function getOptimalLots(
    availableCapital: number,
    ipo: IPO,
    category: ApplicationCategory
): number {
    const requirements = getCategoryRequirements(ipo, category);
    const costPerLot = ipo.max_price * ipo.lot_size;

    // Calculate max lots we can afford
    const maxAffordable = Math.floor(availableCapital / costPerLot);

    // Return the minimum of what we can afford and category limits
    return Math.max(
        requirements.minLots,
        Math.min(maxAffordable, requirements.maxLots)
    );
}

/**
 * Calculate combined probability when applying with multiple retail accounts
 * Each retail application is independent, so we calculate probability of getting at least one allotment
 */
export function calculateMultiAccountProbability(
    singleAccountProbability: number,
    numAccounts: number
): number {
    if (numAccounts === 1) return singleAccountProbability;

    // Probability of getting at least one allotment across N accounts
    // P(at least one) = 1 - P(none)
    // P(none) = (1 - p)^n
    const probNone = Math.pow(1 - (singleAccountProbability / 100), numAccounts);
    const probAtLeastOne = (1 - probNone) * 100;

    return Math.min(100, probAtLeastOne);
}

/**
 * Calculate expected lots across multiple retail accounts
 */
export function calculateMultiAccountExpectedLots(
    lotsPerAccount: number,
    probability: number,
    numAccounts: number
): number {
    // Each account applies independently
    // Expected total lots = sum of expected lots per account
    const expectedPerAccount = (lotsPerAccount * probability) / 100;
    return expectedPerAccount * numAccounts;
}

/**
 * Validate if retail limit is respected (max ₹2L per person typically)
 */
export function validateRetailLimit(
    ipo: IPO,
    numLots: number,
    retailLimitInr: number = 200000
): boolean {
    const totalCost = ipo.max_price * ipo.lot_size * numLots;
    return totalCost <= retailLimitInr;
}
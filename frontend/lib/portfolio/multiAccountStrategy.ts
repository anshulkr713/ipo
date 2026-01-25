// multiAccountStrategy.ts - Family-Optimized Allocation Strategy
// Implements: Timeline Clustering → Shareholder Priority → Family Swarm (sHNI vs Retail)

import {
    IPO,
    ApplicationCategory,
    MarketType,
    Application,
    ApplicationStrategy,
    UserPortfolio,
} from './types';

import {
    calculateAllotmentProbability,
    calculateExpectedProfit,
    calculateExpectedLots,
    getCategoryRequirements,
    calculateRiskScore,
    calculateWeightedProbability,
    canAfford,
    getOptimalLots,
    getSubscriptionForCategory,
    getShareholderAllotmentMode,
} from './probabilityCalculator';

/**
 * STEP A: Timeline Clustering Helper
 * Groups IPOs into "Conflict Cluster" (funds blocked) vs "Pipeline" (funds reusable)
 */
interface TimelineCluster {
    conflictCluster: IPO[];  // IPOs closing within 2 days of earliest
    pipeline: IPO[];         // IPOs closing >2 days later
    earliestCloseDate: Date;
}

function clusterIPOsByTimeline(openIPOs: IPO[]): TimelineCluster {
    if (openIPOs.length === 0) {
        return {
            conflictCluster: [],
            pipeline: [],
            earliestCloseDate: new Date()
        };
    }

    // Sort by close_date (ascending)
    const sortedIPOs = [...openIPOs].sort((a, b) => {
        return new Date(a.close_date).getTime() - new Date(b.close_date).getTime();
    });

    const earliestCloseDate = new Date(sortedIPOs[0].close_date);
    const twoDaysLater = new Date(earliestCloseDate);
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);

    const conflictCluster: IPO[] = [];
    const pipeline: IPO[] = [];

    for (const ipo of sortedIPOs) {
        const closeDate = new Date(ipo.close_date);
        if (closeDate <= twoDaysLater) {
            conflictCluster.push(ipo);
        } else {
            pipeline.push(ipo);
        }
    }

    return {
        conflictCluster,
        pipeline,
        earliestCloseDate
    };
}

/**
 * STEP B: Shareholder Priority Helper
 * Returns shareholder applications if user is eligible
 */
interface ShareholderAllocation {
    applications: Application[];
    capitalUsed: number;
    pansUsed: number;
}

function allocateShareholderQuota(
    userPortfolio: UserPortfolio,
    conflictIPOs: IPO[],
    availableCapital: number,
    availablePANs: number
): ShareholderAllocation {
    const applications: Application[] = [];
    let capitalUsed = 0;
    let pansUsed = 0;

    const eligibleSlugs = userPortfolio.shareholderEligibleIPOs || [];

    for (const ipo of conflictIPOs) {
        // Check if user is eligible for this IPO
        if (!eligibleSlugs.includes(ipo.slug)) continue;

        // Check if we have enough PANs and capital
        if (pansUsed >= availablePANs || capitalUsed >= availableCapital) break;

        const allotmentMode = getShareholderAllotmentMode(ipo);
        const marketType = ipo.category.toLowerCase() as MarketType;
        const category: ApplicationCategory = 'retail'; // Shareholder quota is retail category

        let targetInvestment: number;
        let allocationMessage: string;

        if (allotmentMode === 'PRO_RATA') {
            // Guaranteed allotment - allocate MAX (~₹2L)
            targetInvestment = Math.min(200000, availableCapital - capitalUsed);
            allocationMessage = 'PRO_RATA (Guaranteed)';
        } else {
            // Lottery - allocate MIN (~₹15k)
            targetInvestment = Math.min(15000, availableCapital - capitalUsed);
            allocationMessage = 'LOTTERY';
        }

        const optimalLots = getOptimalLots(targetInvestment, ipo, category);
        const costPerLot = ipo.max_price * ipo.lot_size;
        const totalCost = costPerLot * optimalLots;

        if (canAfford(targetInvestment, ipo, category, optimalLots)) {
            const probability = allotmentMode === 'PRO_RATA' ? 100 :
                calculateAllotmentProbability(ipo, category, marketType);
            const expectedProfit = calculateExpectedProfit(ipo, category, optimalLots, probability);

            applications.push({
                ipo,
                category,
                marketType,
                numLots: optimalLots,
                costPerLot,
                totalCost,
                allotmentProbability: probability,
                expectedLots: calculateExpectedLots(optimalLots, probability),
                profitPerLot: ipo.gmp_amount * ipo.lot_size,
                expectedProfit,
                subscription: getSubscriptionForCategory(ipo, category, marketType)
            });

            capitalUsed += totalCost;
            pansUsed += 1; // Each shareholder application uses 1 PAN
        }
    }

    return {
        applications,
        capitalUsed,
        pansUsed
    };
}

/**
 * STEP C: Family Swarm Helper
 * Creates sHNI applications first, then uses leftover capital for Retail
 */
interface FamilySwarmAllocation {
    applications: Application[];
    capitalUsed: number;
}

function allocateFamilySwarm(
    conflictIPOs: IPO[],
    availableCapital: number,
    availablePANs: number
): FamilySwarmAllocation {
    const applications: Application[] = [];
    let capitalUsed = 0;
    const SHNI_TARGET = 210000; // ~₹2.1L for sHNI

    // Rank IPOs by score (probability × GMP)
    const rankedIPOs = [...conflictIPOs].sort((a, b) => {
        const marketTypeA = a.category.toLowerCase() as MarketType;
        const marketTypeB = b.category.toLowerCase() as MarketType;

        const probA = calculateAllotmentProbability(a, 'shni', marketTypeA);
        const probB = calculateAllotmentProbability(b, 'shni', marketTypeB);

        const scoreA = probA * a.gmp_percentage;
        const scoreB = probB * b.gmp_percentage;

        return scoreB - scoreA;
    });

    // Priority 1: Create sHNI applications
    for (const ipo of rankedIPOs) {
        if (availablePANs <= 0) break;
        if (availableCapital - capitalUsed < SHNI_TARGET) break;

        const marketType = ipo.category.toLowerCase() as MarketType;
        const category: ApplicationCategory = 'shni';
        const optimalLots = getOptimalLots(SHNI_TARGET, ipo, category);
        const costPerLot = ipo.max_price * ipo.lot_size;
        const totalCost = costPerLot * optimalLots;

        // Check if we can afford sHNI
        if (totalCost >= 200000 && totalCost <= SHNI_TARGET + 50000) {
            if (canAfford(availableCapital - capitalUsed, ipo, category, optimalLots)) {
                const probability = calculateAllotmentProbability(ipo, category, marketType);
                const expectedProfit = calculateExpectedProfit(ipo, category, optimalLots, probability);

                applications.push({
                    ipo,
                    category,
                    marketType,
                    numLots: optimalLots,
                    costPerLot,
                    totalCost,
                    allotmentProbability: probability,
                    expectedLots: calculateExpectedLots(optimalLots, probability),
                    profitPerLot: ipo.gmp_amount * ipo.lot_size,
                    expectedProfit,
                    subscription: getSubscriptionForCategory(ipo, category, marketType)
                });

                capitalUsed += totalCost;
                availablePANs -= 1;
            }
        }
    }

    // Priority 2: Use leftover capital for Retail applications
    const retailCapital = availableCapital - capitalUsed;
    if (retailCapital >= 15000 && availablePANs > 0) {
        for (const ipo of rankedIPOs) {
            if (availablePANs <= 0) break;
            if (availableCapital - capitalUsed < 15000) break;

            const marketType = ipo.category.toLowerCase() as MarketType;
            const category: ApplicationCategory = 'retail';
            const remainingCapital = availableCapital - capitalUsed;
            const optimalLots = getOptimalLots(remainingCapital, ipo, category);
            const costPerLot = ipo.max_price * ipo.lot_size;
            const totalCost = costPerLot * optimalLots;

            // Only add retail if it's < ₹2L (otherwise it's sHNI territory)
            if (totalCost < 200000 && canAfford(remainingCapital, ipo, category, optimalLots)) {
                const probability = calculateAllotmentProbability(ipo, category, marketType);
                const expectedProfit = calculateExpectedProfit(ipo, category, optimalLots, probability);

                applications.push({
                    ipo,
                    category,
                    marketType,
                    numLots: optimalLots,
                    costPerLot,
                    totalCost,
                    allotmentProbability: probability,
                    expectedLots: calculateExpectedLots(optimalLots, probability),
                    profitPerLot: ipo.gmp_amount * ipo.lot_size,
                    expectedProfit,
                    subscription: getSubscriptionForCategory(ipo, category, marketType)
                });

                capitalUsed += totalCost;
                availablePANs -= 1;
            }
        }
    }

    return {
        applications,
        capitalUsed
    };
}

/**
 * MAIN FUNCTION: Generate Multi-Account Strategies with Family-Optimized Logic
 * 
 * 3-Step Priority:
 * A. Timeline Clustering (Refund Awareness)
 * B. Shareholder Priority (PRO_RATA vs LOTTERY)
 * C. Family Swarm (sHNI > Retail)
 */
export async function generateMultiAccountStrategies(
    userPortfolio: UserPortfolio,
    openIPOs: IPO[]
): Promise<ApplicationStrategy[]> {
    const strategies: ApplicationStrategy[] = [];

    // STEP A: Timeline Clustering
    const { conflictCluster, pipeline, earliestCloseDate } = clusterIPOsByTimeline(openIPOs);

    if (conflictCluster.length === 0) {
        // No open IPOs
        return [createEmptyStrategy('no-ipos-available')];
    }

    // Track available resources
    let availableCapital = userPortfolio.totalCapital;
    let availablePANs = userPortfolio.numRetailAccounts;
    const allApplications: Application[] = [];

    // STEP B: Shareholder Priority
    const shareholderAllocation = allocateShareholderQuota(
        userPortfolio,
        conflictCluster,
        availableCapital,
        availablePANs
    );

    allApplications.push(...shareholderAllocation.applications);
    availableCapital -= shareholderAllocation.capitalUsed;
    availablePANs -= shareholderAllocation.pansUsed;

    // STEP C: Family Swarm (sHNI priority, then Retail cleanup)
    const familySwarmAllocation = allocateFamilySwarm(
        conflictCluster,
        availableCapital,
        availablePANs
    );

    allApplications.push(...familySwarmAllocation.applications);

    // Build recommendation text
    let recommendation = '';
    if (shareholderAllocation.applications.length > 0) {
        recommendation += `🎯 **Shareholder Priority**: ${shareholderAllocation.applications.length} quota application(s). `;
    }

    const shniCount = allApplications.filter(app => app.category === 'shni').length;
    const retailCount = allApplications.filter(app => app.category === 'retail').length;

    if (shniCount > 0) {
        recommendation += `⚡ **Family Swarm**: ${shniCount} sHNI application(s) for maximum impact. `;
    }
    if (retailCount > 0) {
        recommendation += `✅ ${retailCount} Retail application(s) to utilize remaining capital. `;
    }

    // Mention pipeline IPOs
    if (pipeline.length > 0) {
        const pipelineNames = pipeline.slice(0, 2).map(ipo => ipo.company_name).join(', ');
        recommendation += `📋 **Pipeline**: ${pipeline.length} IPO(s) closing later (${pipelineNames}${pipeline.length > 2 ? ', ...' : ''}) - funds can be reused after refunds.`;
    }

    // Calculate metrics
    const probabilities = allApplications.map(app => app.allotmentProbability);
    const weightedProb = calculateWeightedProbability(probabilities);
    const avgProb = probabilities.length > 0
        ? probabilities.reduce((a, b) => a + b, 0) / probabilities.length
        : 0;
    const totalCost = allApplications.reduce((sum, app) => sum + app.totalCost, 0);
    const expectedProfit = allApplications.reduce((sum, app) => sum + app.expectedProfit, 0);

    const strategy: ApplicationStrategy = {
        strategyId: 'family-optimized-strategy',
        strategyName: '🏆 Family-Optimized Allocation',
        description: `Smart allocation across ${conflictCluster.length} IPO(s) closing by ${earliestCloseDate.toLocaleDateString()}`,
        totalCost,
        applications: allApplications,
        expectedProfit,
        weightedProbability: weightedProb,
        riskScore: calculateRiskScore(allApplications.length, avgProb, totalCost),
        recommendation,
        diversificationScore: Math.min(100, allApplications.length * 20)
    };

    strategies.push(strategy);

    // If no applications were created, return empty strategy
    if (allApplications.length === 0) {
        return [createEmptyStrategy('insufficient-capital-or-pans')];
    }

    return strategies;
}

/**
 * Helper: Create empty strategy
 */
function createEmptyStrategy(id: string): ApplicationStrategy {
    const messages: Record<string, string> = {
        'no-ipos-available': 'No open IPOs available at this time',
        'insufficient-capital-or-pans': 'Insufficient capital or PANs to create applications'
    };

    return {
        strategyId: id,
        strategyName: 'No Strategy Available',
        description: messages[id] || 'Unable to generate strategy',
        totalCost: 0,
        applications: [],
        expectedProfit: 0,
        weightedProbability: 0,
        riskScore: 'HIGH',
        recommendation: 'Please check your portfolio settings or wait for new IPOs to open.',
        diversificationScore: 0
    };
}
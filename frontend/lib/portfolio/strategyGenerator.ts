// strategyGenerator.ts - Generate optimal IPO application strategies

import {
  IPO,
  ApplicationCategory,
  MarketType,
  Application,
  ApplicationStrategy,
  IPOAnalysis,
  CategoryAnalysis,
  StrategyComparison
} from './types';

import {
  calculateAllotmentProbability,
  calculateExpectedProfit,
  calculateExpectedLots,
  getCategoryRequirements,
  calculateROI,
  calculateApplicationScore,
  calculateRiskScore,
  calculateWeightedProbability,
  canAfford,
  getOptimalLots,
  getSubscriptionForCategory
} from './probabilityCalculator';

/**
 * Main function: Generate all possible strategies for given capital
 */
export async function generateAllStrategies(
  capital: number,
  openIPOs: IPO[]
): Promise<StrategyComparison> {
  // First, analyze all IPOs across all categories
  const ipoAnalyses = analyzeAllIPOs(openIPOs);

  // Generate different strategy types
  const strategies: ApplicationStrategy[] = [
    generateMaxRetailStrategy(capital, ipoAnalyses),
    generateConcentratedHNIStrategy(capital, ipoAnalyses),
    generateMixedStrategy(capital, ipoAnalyses),
    generateGMPFocusedStrategy(capital, ipoAnalyses),
    generateProbabilityMaxStrategy(capital, ipoAnalyses),
    generateBalancedStrategy(capital, ipoAnalyses)
  ].filter(s => s.applications.length > 0); // Remove empty strategies

  // Sort by expected value (expected profit adjusted for risk)
  const sorted = strategies.sort((a, b) => {
    const evA = calculateExpectedValue(a);
    const evB = calculateExpectedValue(b);
    return evB - evA;
  });

  return {
    strategies: sorted,
    bestForProfit: sorted.reduce((best, s) =>
      s.expectedProfit > best.expectedProfit ? s : best
    ),
    bestForProbability: sorted.reduce((best, s) =>
      s.weightedProbability > best.weightedProbability ? s : best
    ),
    bestForRisk: sorted.find(s => s.riskScore === 'LOW') || sorted[0],
    recommended: sorted[0]
  };
}

/**
 * Analyze all IPOs across all applicable categories
 */
function analyzeAllIPOs(ipos: IPO[]): IPOAnalysis[] {
  return ipos.map(ipo => {
    const marketType = ipo.category.toLowerCase() as MarketType;
    const categories = ['retail', 'shni', 'bhni'] as ApplicationCategory[];

    const categoryAnalyses: any = {};

    for (const category of categories) {
      const requirements = getCategoryRequirements(ipo, category);
      const subscription = getSubscriptionForCategory(ipo, category, marketType);
      const probability = calculateAllotmentProbability(ipo, category, marketType);
      const expectedLots = calculateExpectedLots(requirements.minLots, probability);
      const profitPerLot = ipo.gmp_amount * ipo.lot_size;
      const expectedProfit = calculateExpectedProfit(ipo, category, requirements.minLots, probability);
      const roi = calculateROI(expectedProfit, requirements.minInvestment);
      const score = calculateApplicationScore(probability, roi, ipo.gmp_percentage);

      categoryAnalyses[category] = {
        category,
        marketType,
        minInvestment: requirements.minInvestment,
        maxInvestment: requirements.minInvestment * requirements.maxLots,
        requiredLots: requirements.minLots,
        subscription,
        allotmentProbability: probability,
        expectedLots,
        profitPerLot,
        expectedProfit,
        roi,
        score
      } as CategoryAnalysis;
    }

    // Calculate overall score (average of category scores)
    const overallScore = Object.values(categoryAnalyses)
      .reduce((sum: number, cat: any) => sum + cat.score, 0) / 3;

    return {
      ipo,
      categories: categoryAnalyses,
      overallScore,
      recommendation: generateIPORecommendation(ipo, categoryAnalyses)
    };
  });
}

/**
 * Strategy 1: Maximum Retail Applications (Diversification Focus)
 */
function generateMaxRetailStrategy(
  capital: number,
  analyses: IPOAnalysis[]
): ApplicationStrategy {
  const applications: Application[] = [];
  let remainingCapital = capital;

  // Sort by retail category score
  const sorted = [...analyses].sort((a, b) =>
    b.categories.retail.score - a.categories.retail.score
  );

  for (const analysis of sorted) {
    const { ipo, categories } = analysis;
    const category = 'retail';
    const marketType = ipo.category.toLowerCase() as MarketType;
    const catAnalysis = categories[category];

    if (canAfford(remainingCapital, ipo, category, catAnalysis.requiredLots)) {
      applications.push(createApplication(ipo, category, marketType, catAnalysis));
      remainingCapital -= catAnalysis.minInvestment;
    }
  }

  return createStrategy(
    'max-retail',
    '🎯 Maximum Retail Diversification',
    'Apply to as many IPOs as possible in retail category for maximum diversification and high success probability',
    capital,
    applications
  );
}

/**
 * Strategy 2: Concentrated HNI (High Profit Potential)
 */
function generateConcentratedHNIStrategy(
  capital: number,
  analyses: IPOAnalysis[]
): ApplicationStrategy {
  const applications: Application[] = [];
  let remainingCapital = capital;

  // Find best HNI opportunity (bhni or shni based on capital)
  const iposByHNIScore = [...analyses].sort((a, b) => {
    const scoreA = Math.max(a.categories.shni.score, a.categories.bhni.score);
    const scoreB = Math.max(b.categories.shni.score, b.categories.bhni.score);
    return scoreB - scoreA;
  });

  for (const analysis of iposByHNIScore) {
    const { ipo, categories } = analysis;
    const marketType = ipo.category.toLowerCase() as MarketType;

    // Try bHNI first, fall back to sHNI
    const preferredCategories: ApplicationCategory[] = ['bhni', 'shni'];

    for (const category of preferredCategories) {
      const catAnalysis = categories[category];
      const optimalLots = getOptimalLots(remainingCapital, ipo, category);

      if (canAfford(remainingCapital, ipo, category, optimalLots)) {
        const costPerLot = ipo.max_price * ipo.lot_size;
        const totalCost = costPerLot * optimalLots;
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

        remainingCapital -= totalCost;
        break; // Only one HNI application
      }
    }

    if (applications.length > 0) break; // Found our concentrated pick
  }

  return createStrategy(
    'concentrated-hni',
    '💎 Concentrated HNI Power Play',
    'Single high-value application in HNI category for maximum lot allocation potential',
    capital,
    applications
  );
}

/**
 * Strategy 3: Mixed Approach (Balance)
 */
function generateMixedStrategy(
  capital: number,
  analyses: IPOAnalysis[]
): ApplicationStrategy {
  const applications: Application[] = [];
  let remainingCapital = capital;

  // Allocate to top retail IPOs first (60% of capital)
  const retailBudget = capital * 0.6;
  const hniBudget = capital * 0.4;

  // Get top 2-3 retail applications
  const topRetail = [...analyses]
    .sort((a, b) => b.categories.retail.score - a.categories.retail.score)
    .slice(0, 3);

  for (const analysis of topRetail) {
    const { ipo, categories } = analysis;
    const category = 'retail';
    const marketType = ipo.category.toLowerCase() as MarketType;
    const catAnalysis = categories[category];

    if (canAfford(remainingCapital, ipo, category, catAnalysis.requiredLots) &&
      catAnalysis.minInvestment <= retailBudget) {
      applications.push(createApplication(ipo, category, marketType, catAnalysis));
      remainingCapital -= catAnalysis.minInvestment;
    }
  }

  // Add one HNI application if budget allows
  const topHNI = [...analyses]
    .sort((a, b) => {
      const scoreA = Math.max(a.categories.shni.score, a.categories.bhni.score);
      const scoreB = Math.max(b.categories.shni.score, b.categories.bhni.score);
      return scoreB - scoreA;
    })
    .slice(0, 2);

  for (const analysis of topHNI) {
    const { ipo, categories } = analysis;
    const marketType = ipo.category.toLowerCase() as MarketType;

    // Try sHNI (more likely to fit budget)
    const category: ApplicationCategory = 'shni';
    const catAnalysis = categories[category];
    const optimalLots = getOptimalLots(remainingCapital, ipo, category);

    if (canAfford(remainingCapital, ipo, category, optimalLots)) {
      const costPerLot = ipo.max_price * ipo.lot_size;
      const totalCost = costPerLot * optimalLots;
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

      remainingCapital -= totalCost;
      break;
    }
  }

  return createStrategy(
    'mixed',
    '⚖️ Balanced Mixed Approach',
    'Combination of retail applications for safety and one HNI play for higher returns',
    capital,
    applications
  );
}

/**
 * Strategy 4: GMP-Focused (Profit Maximization)
 */
function generateGMPFocusedStrategy(
  capital: number,
  analyses: IPOAnalysis[]
): ApplicationStrategy {
  const applications: Application[] = [];
  let remainingCapital = capital;

  // Sort by GMP percentage
  const byGMP = [...analyses].sort((a, b) =>
    b.ipo.gmp_percentage - a.ipo.gmp_percentage
  );

  // Pick best GMP IPOs across any category
  for (const analysis of byGMP) {
    const { ipo, categories } = analysis;
    const marketType = ipo.category.toLowerCase() as MarketType;

    // Find best category for this IPO (highest expected profit)
    const bestCategory = (['retail', 'shni', 'bhni'] as ApplicationCategory[])
      .map(cat => ({ category: cat, analysis: categories[cat] }))
      .sort((a, b) => b.analysis.expectedProfit - a.analysis.expectedProfit)[0];

    const category = bestCategory.category;
    const catAnalysis = bestCategory.analysis;
    const optimalLots = getOptimalLots(remainingCapital, ipo, category);

    if (canAfford(remainingCapital, ipo, category, optimalLots)) {
      const costPerLot = ipo.max_price * ipo.lot_size;
      const totalCost = costPerLot * optimalLots;
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

      remainingCapital -= totalCost;
    }
  }

  return createStrategy(
    'gmp-focused',
    '🚀 GMP Chaser Strategy',
    'Target IPOs with highest grey market premium for maximum profit potential (higher risk)',
    capital,
    applications
  );
}

/**
 * Strategy 5: Probability Maximization (Safety First)
 */
function generateProbabilityMaxStrategy(
  capital: number,
  analyses: IPOAnalysis[]
): ApplicationStrategy {
  const applications: Application[] = [];
  let remainingCapital = capital;

  // Sort by probability (retail category usually has best odds)
  const byProbability = [...analyses]
    .map(a => ({
      analysis: a,
      maxProbability: Math.max(
        a.categories.retail.allotmentProbability,
        a.categories.shni.allotmentProbability,
        a.categories.bhni.allotmentProbability
      )
    }))
    .sort((a, b) => b.maxProbability - a.maxProbability);

  for (const { analysis } of byProbability) {
    const { ipo, categories } = analysis;
    const marketType = ipo.category.toLowerCase() as MarketType;

    // Find category with highest probability
    const bestCategory = (['retail', 'shni', 'bhni'] as ApplicationCategory[])
      .map(cat => ({ category: cat, probability: categories[cat].allotmentProbability }))
      .sort((a, b) => b.probability - a.probability)[0];

    const category = bestCategory.category;
    const catAnalysis = categories[category];

    if (canAfford(remainingCapital, ipo, category, catAnalysis.requiredLots)) {
      applications.push(createApplication(ipo, category, marketType, catAnalysis));
      remainingCapital -= catAnalysis.minInvestment;
    }
  }

  return createStrategy(
    'probability-max',
    '🎯 Maximum Probability Strategy',
    'Focus on IPOs with highest allotment probability for assured returns (conservative)',
    capital,
    applications
  );
}

/**
 * Strategy 6: Balanced Optimal (AI Recommendation)
 */
function generateBalancedStrategy(
  capital: number,
  analyses: IPOAnalysis[]
): ApplicationStrategy {
  const applications: Application[] = [];
  let remainingCapital = capital;

  // Use composite scoring (probability + profit + diversification)
  const scored = analyses.map(analysis => ({
    analysis,
    compositeScore: calculateCompositeScore(analysis)
  })).sort((a, b) => b.compositeScore - a.compositeScore);

  for (const { analysis } of scored) {
    const { ipo, categories } = analysis;
    const marketType = ipo.category.toLowerCase() as MarketType;

    // Choose best category for this capital level
    const affordableCategories = (['retail', 'shni', 'bhni'] as ApplicationCategory[])
      .filter(cat => categories[cat].minInvestment <= remainingCapital)
      .map(cat => ({ category: cat, analysis: categories[cat] }))
      .sort((a, b) => {
        const scoreA = calculateApplicationScore(
          a.analysis.allotmentProbability,
          a.analysis.roi,
          ipo.gmp_percentage
        );
        const scoreB = calculateApplicationScore(
          b.analysis.allotmentProbability,
          b.analysis.roi,
          ipo.gmp_percentage
        );
        return scoreB - scoreA;
      });

    if (affordableCategories.length > 0) {
      const best = affordableCategories[0];
      const category = best.category;
      const catAnalysis = best.analysis;
      const optimalLots = getOptimalLots(remainingCapital, ipo, category);

      if (canAfford(remainingCapital, ipo, category, optimalLots)) {
        const costPerLot = ipo.max_price * ipo.lot_size;
        const totalCost = costPerLot * optimalLots;
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

        remainingCapital -= totalCost;
      }
    }
  }

  return createStrategy(
    'ai-balanced',
    '🤖 AI-Optimized Strategy',
    'Data-driven optimal allocation balancing probability, profit, and risk (recommended)',
    capital,
    applications
  );
}

/**
 * Helper: Create Application object from analysis
 */
function createApplication(
  ipo: IPO,
  category: ApplicationCategory,
  marketType: MarketType,
  analysis: CategoryAnalysis
): Application {
  return {
    ipo,
    category,
    marketType,
    numLots: analysis.requiredLots,
    costPerLot: ipo.max_price * ipo.lot_size,
    totalCost: analysis.minInvestment,
    allotmentProbability: analysis.allotmentProbability,
    expectedLots: analysis.expectedLots,
    profitPerLot: analysis.profitPerLot,
    expectedProfit: analysis.expectedProfit,
    subscription: analysis.subscription
  };
}

/**
 * Helper: Create Strategy object
 */
function createStrategy(
  id: string,
  name: string,
  description: string,
  capital: number,
  applications: Application[]
): ApplicationStrategy {
  const totalCost = applications.reduce((sum, app) => sum + app.totalCost, 0);
  const expectedProfit = applications.reduce((sum, app) => sum + app.expectedProfit, 0);
  const probabilities = applications.map(app => app.allotmentProbability);
  const weightedProbability = calculateWeightedProbability(probabilities);
  const avgProbability = probabilities.reduce((a, b) => a + b, 0) / probabilities.length || 0;
  const riskScore = calculateRiskScore(applications.length, avgProbability, totalCost);
  const diversificationScore = Math.min(100, applications.length * 20);

  return {
    strategyId: id,
    strategyName: name,
    description,
    totalCost,
    applications,
    expectedProfit,
    weightedProbability,
    riskScore,
    recommendation: generateStrategyRecommendation(applications, riskScore),
    diversificationScore
  };
}

/**
 * Calculate expected value with risk adjustment
 */
function calculateExpectedValue(strategy: ApplicationStrategy): number {
  const baseEV = strategy.expectedProfit;

  // Risk premium/penalty
  const riskMultiplier = {
    'LOW': 1.1,      // 10% bonus for low risk
    'MEDIUM': 1.0,   // No adjustment
    'HIGH': 0.85     // 15% penalty for high risk
  }[strategy.riskScore];

  // Diversification bonus
  const diversificationBonus = Math.min(strategy.diversificationScore / 100, 0.2);

  return baseEV * riskMultiplier * (1 + diversificationBonus);
}

/**
 * Calculate composite score for balanced strategy
 */
function calculateCompositeScore(analysis: IPOAnalysis): number {
  const { categories, ipo } = analysis;

  // Average score across categories, weighted by affordability
  const retailScore = categories.retail.score * 1.2;  // Prefer retail
  const shniScore = categories.shni.score * 1.0;
  const bhniScore = categories.bhni.score * 0.8;      // Penalize high capital requirement

  return (retailScore + shniScore + bhniScore) / 3;
}

/**
 * Generate recommendation text for strategy
 */
function generateStrategyRecommendation(
  applications: Application[],
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH'
): string {
  const numApps = applications.length;
  const avgProb = applications.reduce((sum, app) => sum + app.allotmentProbability, 0) / numApps;

  if (riskScore === 'LOW' && numApps >= 3) {
    return `Excellent diversification across ${numApps} IPOs with ${avgProb.toFixed(0)}% average success rate. Low risk, steady returns.`;
  } else if (riskScore === 'HIGH' && numApps === 1) {
    return `High-risk concentrated play. Potential for significant returns but ${(100 - avgProb).toFixed(0)}% chance of no allotment.`;
  } else {
    return `Balanced approach with ${numApps} applications. Good risk-reward ratio with ${avgProb.toFixed(0)}% success probability.`;
  }
}

/**
 * Generate recommendation for individual IPO
 */
function generateIPORecommendation(
  ipo: IPO,
  categories: Record<ApplicationCategory, CategoryAnalysis>
): string {
  const bestCategory = (['retail', 'shni', 'bhni'] as ApplicationCategory[])
    .map(cat => ({ category: cat, score: categories[cat].score }))
    .sort((a, b) => b.score - a.score)[0];

  const catName = {
    'retail': 'Retail',
    'shni': 'sHNI',
    'bhni': 'bHNI'
  }[bestCategory.category];

  return `Best applied in ${catName} category with ${categories[bestCategory.category].allotmentProbability.toFixed(0)}% probability`;
}
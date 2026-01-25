// types.ts - TypeScript interfaces for Portfolio Optimizer

export interface IPO {
  slug: string;
  ipo_name: string;
  company_name: string;
  category: 'Mainboard' | 'SME';
  min_price: number;
  max_price: number;
  lot_size: number;
  issue_size_cr: number;

  // Subscription data (live from backend)
  subscription_retail: number;
  subscription_nii: number;      // sHNI for Mainboard
  subscription_bnii: number;     // bHNI for Mainboard
  subscription_qib: number;
  subscription_total: number;
  subscription_updated_at?: string;

  // GMP data (live from backend)
  gmp_amount: number;
  gmp_percentage: number;
  expected_listing_price: number;
  gmp_updated_at?: string;

  // Additional constraints from IPO
  retail_min_lots?: number;      // Usually 1
  retail_max_lots?: number;      // Usually 13-15 (up to ₹2L)
  shni_min_lots?: number;        // Usually 2
  shni_max_lots?: number;        // Varies by IPO
  bhni_min_lots?: number;        // Usually 10+

  // NEW: Shareholder quota fields
  has_shareholder_quota: boolean;
  shares_offered_shareholder: number;
  applications_count_shareholder: number;
  subscription_shni: number;     // Small HNI subscription
  subscription_bhni: number;     // Big HNI subscription

  // Dates
  open_date: string;
  close_date: string;
  listing_date?: string;
  status: 'open' | 'upcoming' | 'closed';
}

export type ApplicationCategory = 'retail' | 'shni' | 'bhni';
export type MarketType = 'mainboard' | 'sme';

export interface CategoryRequirements {
  minLots: number;
  maxLots: number;
  minInvestment: number;
}

export interface Application {
  ipo: IPO;
  category: ApplicationCategory;
  marketType: MarketType;
  numLots: number;
  costPerLot: number;
  totalCost: number;
  allotmentProbability: number;
  expectedLots: number;
  profitPerLot: number;
  expectedProfit: number;
  subscription: number;
}

export interface ApplicationStrategy {
  strategyId: string;
  strategyName: string;
  description: string;
  totalCost: number;
  applications: Application[];
  expectedProfit: number;
  weightedProbability: number;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  diversificationScore: number;
}

export interface IPOAnalysis {
  ipo: IPO;
  categories: {
    [key in ApplicationCategory]: CategoryAnalysis;
  };
  overallScore: number;
  recommendation: string;
}

export interface CategoryAnalysis {
  category: ApplicationCategory;
  marketType: MarketType;
  minInvestment: number;
  maxInvestment: number;
  requiredLots: number;
  subscription: number;
  allotmentProbability: number;
  expectedLots: number;
  profitPerLot: number;
  expectedProfit: number;
  roi: number;
  score: number;
}

export interface StrategyComparison {
  strategies: ApplicationStrategy[];
  bestForProfit: ApplicationStrategy;
  bestForProbability: ApplicationStrategy;
  bestForRisk: ApplicationStrategy;
  recommended: ApplicationStrategy;
}

export interface CapitalAllocation {
  totalCapital: number;
  allocated: number;
  remaining: number;
  utilizationPercent: number;
}

/**
 * User's portfolio configuration - SIMPLIFIED
 * Just ask: How many people? How much total money?
 */
export interface UserPortfolio {
  totalCapital: number;
  numRetailAccounts: number;  // Number of family members (1-6)

  // HNI capability (optional)
  hasHNICapability?: boolean;
  hniCapital?: number;

  // NEW: Shareholder eligibility
  shareholderEligibleIPOs?: string[];  // Array of IPO slugs user is eligible for

  // Preferences (optional)
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  preferMainboard?: boolean;
  preferSME?: boolean;
}

/**
 * Retail account representation (auto-generated from numRetailAccounts)
 * System will auto-distribute capital optimally across accounts
 */
export interface RetailAccount {
  accountId: string;
  accountName: string;  // e.g., "Account 1", "Account 2", etc.
  allocatedCapital: number;  // Auto-calculated by optimizer
}

/**
 * Multi-account application strategy
 * Can have multiple retail applications in same IPO
 */
export interface MultiAccountApplication {
  ipo: IPO;
  retailApplications: RetailApplicationDetails[];
  hniApplication?: Application;
  totalInvestment: number;
  totalExpectedProfit: number;
  combinedProbability: number;
}

export interface RetailApplicationDetails {
  account: RetailAccount;
  numLots: number;
  totalCost: number;
  allotmentProbability: number;
  expectedLots: number;
  expectedProfit: number;
}
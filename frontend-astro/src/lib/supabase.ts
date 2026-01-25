import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Core IPO Table
// ============================================

export interface IPO {
    id: number;
    ipo_name: string;
    company_name: string;
    slug: string;
    category: 'SME' | 'Mainboard';
    status: 'upcoming' | 'open' | 'closed' | 'listed' | 'withdrawn';
    issue_type?: 'Fresh Issue' | 'Offer for Sale' | 'Fresh Issue + OFS';
    issue_size_cr?: number;
    fresh_issue_size_cr?: number;
    ofs_size_cr?: number;
    lot_size: number;
    min_price?: number;
    max_price?: number;
    final_price?: number;
    face_value?: number;
    open_date: string;
    close_date: string;
    allotment_date?: string;
    refund_date?: string;
    demat_credit_date?: string;
    listing_date?: string;
    parent_company?: string;
    company_description?: string;
    industry_sector?: string;
    incorporation_date?: string;
    registered_office?: string;
    company_website?: string;
    registrar?: string;
    registrar_website?: string;
    lead_managers?: string[];
    exchange?: string[];
    drhp_status?: 'filed' | 'pending' | 'approved';
    drhp_filed_date?: string;
    rhp_status?: 'filed' | 'pending' | 'approved';
    rhp_filed_date?: string;
    sebi_approval_date?: string;
    actual_listing_price?: number;
    listing_gain_percent?: number;
    current_price?: number;
    current_gain_percent?: number;
    meta_title?: string;
    meta_description?: string;
    is_featured?: boolean;
    trending_score?: number;
    data_quality_score?: number;
    last_scraped_at?: string;
    scrape_source?: string;
    created_at?: string;
    updated_at?: string;
}

// ============================================
// Related Tables
// ============================================

export interface IPOGmp {
    id: number;
    ipo_id: number;
    gmp_amount: number;
    gmp_percentage?: number;
    issue_price: number;
    estimated_listing_price?: number;
    subject_rate?: number;
    kostak_rate?: number;
    source?: string;
    recorded_at?: string;
    is_latest?: boolean;
}

export interface IPOSubscription {
    id: number;
    ipo_id: number;
    subscription_total?: number;
    subscription_qib?: number;
    subscription_nii?: number;
    subscription_retail?: number;
    subscription_employee?: number;
    subscription_shareholder?: number;
    subscription_shni?: number;
    subscription_bhni?: number;
    applications_count_total?: number;
    applications_count_qib?: number;
    applications_count_nii?: number;
    applications_count_retail?: number;
    applications_count_employee?: number;
    applications_count_shareholder?: number;
    applications_count_shni?: number;
    applications_count_bhni?: number;
    subscription_day?: number;
    source?: 'BSE' | 'NSE' | 'Combined';
    recorded_at?: string;
    is_latest?: boolean;
}

export interface IPOAllotment {
    id: number;
    ipo_id: number;
    category: 'QIB' | 'NII' | 'Retail' | 'Employee' | 'Shareholder' | 'Anchor';
    total_applications?: number;
    total_shares_applied?: number;
    total_shares_allotted?: number;
    allotment_percentage?: number;
    allotment_ratio?: string;
    registrar_link?: string;
    link_type?: 'allotment' | 'refund' | 'status';
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface IPOTimeline {
    id: number;
    ipo_id: number;
    event_type: 'DRHP Filed' | 'RHP Filed' | 'SEBI Approval' | 'Price Band Announced' | 'Anchor Bidding' | 'IPO Opens' | 'IPO Closes' | 'Basis of Allotment' | 'Allotment Finalized' | 'Refund Initiation' | 'Demat Credit' | 'Listing Date';
    event_date: string;
    event_title: string;
    event_description?: string;
    event_status?: 'Scheduled' | 'Completed' | 'Cancelled';
    created_at?: string;
}

export interface IPOFinancials {
    id: number;
    ipo_id: number;
    financial_year: string;
    period_type?: 'Annual' | 'Quarterly';
    period_end_date?: string;
    revenue?: number;
    ebitda?: number;
    ebitda_margin?: number;
    profit_before_tax?: number;
    profit_after_tax?: number;
    pat_margin?: number;
    total_assets?: number;
    total_liabilities?: number;
    net_worth?: number;
    reserves?: number;
    borrowings?: number;
    eps?: number;
    nav?: number;
    face_value?: number;
    book_value?: number;
    pe_ratio?: number;
    pb_ratio?: number;
    debt_equity_ratio?: number;
    roe?: number;
    ronw?: number;
    roce?: number;
    created_at?: string;
}

export interface IPOReview {
    id: number;
    ipo_id: number;
    reviewer_name: string;
    reviewer_type?: 'Broker' | 'Research Firm' | 'Independent Analyst' | 'Platform';
    rating?: number;
    recommendation?: 'Subscribe' | 'Avoid' | 'Subscribe for Listing Gains' | 'Subscribe for Long-term' | 'Neutral';
    review_title?: string;
    review_summary?: string;
    review_content?: string;
    strengths?: string[];
    risks?: string[];
    valuation_view?: string;
    reviewed_at?: string;
    is_featured?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface IPODocument {
    id: number;
    ipo_id: number;
    document_type: 'DRHP' | 'RHP' | 'Prospectus' | 'Addendum' | 'Corporate Presentation' | 'Basis of Allotment' | 'Other';
    document_title: string;
    document_url: string;
    file_size_mb?: number;
    pages_count?: number;
    upload_date?: string;
    download_count?: number;
    created_at?: string;
}

export interface IPOShareholding {
    id: number;
    ipo_id: number;
    holding_type?: 'Pre-IPO' | 'Post-IPO';
    promoter_holding_percentage?: number;
    promoter_shares?: number;
    public_holding_percentage?: number;
    public_shares?: number;
    fii_holding_percentage?: number;
    dii_holding_percentage?: number;
    retail_holding_percentage?: number;
    created_at?: string;
}

export interface IPOReservation {
    id: number;
    ipo_id: number;
    category: 'QIB' | 'NII' | 'Retail' | 'Employee' | 'Shareholder' | 'SHNI' | 'BHNI' | 'Anchor';
    reserved_percentage?: number;
    reserved_shares?: number;
    min_lots?: number;
    max_lots?: number;
    min_investment_amount?: number;
    max_investment_amount?: number;
    discount_percentage?: number;
}

export interface IPOComparable {
    id: number;
    ipo_id: number;
    comparable_name: string;
    comparable_ticker?: string;
    market_cap_cr?: number;
    pe_ratio?: number;
    pb_ratio?: number;
    revenue_cr?: number;
    pat_cr?: number;
    created_at?: string;
}

export interface IPOAnchorInvestor {
    id: number;
    ipo_id: number;
    investor_name: string;
    investor_type?: 'Domestic Mutual Fund' | 'Foreign Portfolio Investor' | 'Insurance Company' | 'Bank' | 'Pension Fund' | 'Alternate Investment Fund' | 'Others';
    shares_allotted?: number;
    amount_invested_cr?: number;
    price_per_share?: number;
    created_at?: string;
}

export interface IPOObjective {
    id: number;
    ipo_id: number;
    objective_category: string;
    objective_description?: string;
    amount_allocated_cr?: number;
    percentage_of_total?: number;
    created_at?: string;
}

export interface IPOTechnicalAnalysis {
    id: number;
    ipo_id: number;
    price_band_low?: number;
    price_band_high?: number;
    anchor_price?: number;
    expected_listing_price?: number;
    price_to_earnings?: number;
    price_to_book?: number;
    price_to_sales?: number;
    ev_to_ebitda?: number;
    ev_to_revenue?: number;
    pre_ipo_market_cap_cr?: number;
    post_ipo_market_cap_cr?: number;
    enterprise_value_cr?: number;
    peer_median_pe?: number;
    peer_median_pb?: number;
    premium_discount_to_peers?: number;
    revenue_cagr_3y?: number;
    profit_cagr_3y?: number;
    piotroski_score?: number;
    altman_z_score?: number;
    market_condition?: 'Bull Market' | 'Bear Market' | 'Sideways';
    sector_sentiment?: 'Positive' | 'Negative' | 'Neutral';
    analysis_date?: string;
    analyst_notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface IPOComment {
    id: number;
    ipo_id: number;
    user_name: string;
    user_email: string;
    comment_text: string;
    should_apply_vote?: 'Yes' | 'No';
    is_approved?: boolean;
    is_featured?: boolean;
    parent_id?: number;
    upvotes?: number;
    downvotes?: number;
    created_at?: string;
}

export interface IPOFAQ {
    id: number;
    ipo_id?: number;
    question: string;
    answer: string;
    category?: string;
    display_order?: number;
    is_general?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ScrapingLog {
    id: number;
    scrape_type: string;
    source: string;
    url?: string;
    status?: 'Success' | 'Partial' | 'Failed';
    records_found?: number;
    records_updated?: number;
    errors_count?: number;
    error_details?: Record<string, unknown>;
    execution_time_seconds?: number;
    occurred_at?: string;
}

// ============================================
// Joined/Extended Types for API responses
// ============================================

export interface IPOWithGmp extends IPO {
    ipo_gmp?: IPOGmp[];
}

export interface IPOWithSubscription extends IPO {
    ipo_subscriptions?: IPOSubscription[];
}

export interface IPOWithDetails extends IPO {
    ipo_gmp?: IPOGmp[];
    ipo_subscriptions?: IPOSubscription[];
    ipo_timeline?: IPOTimeline[];
    ipo_allotment?: IPOAllotment[];
    ipo_financials?: IPOFinancials[];
    ipo_reviews?: IPOReview[];
    ipo_documents?: IPODocument[];
    ipo_shareholding?: IPOShareholding[];
    ipo_reservations?: IPOReservation[];
    ipo_comparables?: IPOComparable[];
    ipo_anchor_investors?: IPOAnchorInvestor[];
    ipo_objectives?: IPOObjective[];
    ipo_technical_analysis?: IPOTechnicalAnalysis[];
    ipo_comments?: IPOComment[];
    ipo_faqs?: IPOFAQ[];
}

// Legacy type alias for backwards compatibility
export type IPODetail = IPOWithDetails;

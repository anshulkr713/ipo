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
    
    // Flattened Columns
    current_gmp?: number;
    gmp_percentage?: number;
    subscription_total?: number;
    subscription_qib?: number;
    subscription_nii?: number;
    subscription_retail?: number;
    allotment_link?: string;
    allotment_link_active?: boolean;

    // JSONB Collections
    financials?: Array<Record<string, any>>;
    reviews?: Array<Record<string, any>>;
    documents?: Array<Record<string, any>>;
    shareholding?: Array<Record<string, any>>;
    reservations?: Array<Record<string, any>>;
    comparables?: Array<Record<string, any>>;
    anchor_investors?: Array<Record<string, any>>;
    objectives?: Array<Record<string, any>>;
    technical_analysis_data?: Record<string, any>;
    faqs?: Array<Record<string, any>>;
    timeline_events?: Array<Record<string, any>>;

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

    // Retained relations
    ipo_comments?: IPOComment[];
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

// Aliases for compatibility
export type IPOWithDetails = IPO;
export type IPODetail = IPO;
export type IPOWithGmp = IPO;
export type IPOWithSubscription = IPO;
export type IPOGmp = any; // Dummy types in case something still refs it
export type IPOSubscription = any;
export type IPOAllotment = any;
export type IPOTimeline = any;

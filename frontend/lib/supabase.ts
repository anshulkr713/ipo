import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface IPODetail {
    id: number;
    ipo_name: string;
    company_name?: string;
    category?: string;
    issue_size?: string;
    issue_size_numeric?: number;
    price_range?: string;
    min_price?: number;
    max_price?: number;
    lot_size?: number;
    open_date?: string;
    close_date?: string;
    listing_date?: string;
    allotment_date?: string;
    status?: 'upcoming' | 'open' | 'closed' | 'listed';
    drhp_status?: 'filed' | 'pending' | 'approved';
    rhp_status?: 'filed' | 'pending' | 'approved';
    parent_company?: string;
    description?: string;
    website_url?: string;
    lead_managers?: string[];
    registrar?: string;
    exchange?: string[];
    subscription_retail?: number;
    subscription_nii?: number;
    subscription_qib?: number;
    subscription_total?: number;
    created_at?: string;
    updated_at?: string;
}

export interface IPOGMP {
    id: number;
    ipo_name: string;
    gmp?: number;
    price?: number;
    gain_percent?: number;
    subject?: string;
    ipo_date?: string;
    open_date?: string;
    close_date?: string;
    allotment_date?: string;
    listing_date?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ShareholderIntel {
    id: number;
    ipo_name: string;
    parent_company?: string;
    sebi_status?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AllotmentLink {
    id: number;
    ipo_name: string;
    registrar: string;
    link_url: string;
    link_type?: 'allotment' | 'refund' | 'status';
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface GMPHistory {
    id: number;
    ipo_name: string;
    gmp: number;
    price: number;
    gain_percent?: number;
    recorded_at?: string;
}
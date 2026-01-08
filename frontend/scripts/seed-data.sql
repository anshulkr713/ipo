-- =============================================
-- DUMMY DATA FOR IPO TRACKER
-- Run this in Supabase SQL Editor
-- =============================================

-- Update existing IPOs with more complete data
UPDATE public.ipos SET
    parent_company = 'Tata Motors Ltd',
    drhp_status = 'approved',
    rhp_status = 'approved',
    sebi_status = 'Approved',
    pre_ipo_promoter_holding_percent = 74.39,
    post_ipo_promoter_holding_percent = 59.15,
    company_description = 'Tata Technologies is a global engineering and product development digital services company. The company provides services to automotive and aerospace manufacturers worldwide.',
    industry_sector = 'IT Services & Consulting',
    key_highlights = '["Global leader in engineering and design services", "Serving top automotive and aerospace OEMs", "Strong presence in EV and sustainable mobility", "8 global delivery centers"]'::jsonb,
    strengths = '["Strong parentage with Tata Group brand value", "Diversified global client base", "Leadership in ER&D services", "High client retention rate of 95%+"]'::jsonb,
    concerns = '["Premium valuation compared to peers", "High dependence on automotive sector", "Forex exposure due to global operations"]'::jsonb,
    expert_rating = 4.2,
    rating_financial_performance = 4.5,
    rating_valuation = 3.8,
    rating_growth_prospects = 4.5,
    rating_management_quality = 4.2,
    rating_industry_outlook = 4.0,
    expert_recommendation = 'Subscribe for Long-term',
    risk_level = 'Medium',
    investment_horizon = 'Long-term',
    should_apply_yes_votes = 9823,
    should_apply_no_votes = 2720
WHERE ipo_name ILIKE '%Tata Technologies%';

UPDATE public.ipos SET
    parent_company = 'Honasa Consumer Pvt Ltd',
    drhp_status = 'approved',
    rhp_status = 'approved',
    sebi_status = 'Approved',
    pre_ipo_promoter_holding_percent = 35.72,
    post_ipo_promoter_holding_percent = 32.95,
    company_description = 'Mamaearth is a leading direct-to-consumer (D2C) beauty and personal care brand in India, known for its toxin-free products.',
    industry_sector = 'FMCG - Personal Care',
    key_highlights = '["#1 D2C beauty brand in India", "Toxin-free & sustainable products", "Strong digital presence", "Celebrity-backed brand"]'::jsonb,
    strengths = '["Strong brand recognition", "High growth trajectory", "Omnichannel distribution", "Repeat customer base"]'::jsonb,
    concerns = '["High marketing expenses", "Intense competition from FMCG giants", "Path to profitability unclear"]'::jsonb,
    expert_rating = 3.5,
    rating_financial_performance = 3.0,
    rating_valuation = 3.2,
    rating_growth_prospects = 4.2,
    rating_management_quality = 3.8,
    rating_industry_outlook = 4.0,
    expert_recommendation = 'Subscribe for Long-term',
    risk_level = 'High',
    investment_horizon = 'Long-term'
WHERE ipo_name ILIKE '%Mamaearth%' OR ipo_name ILIKE '%Honasa%';

UPDATE public.ipos SET
    parent_company = 'Jio Financial Services Ltd',
    drhp_status = 'approved',
    rhp_status = 'approved',
    sebi_status = 'Approved',
    pre_ipo_promoter_holding_percent = 100,
    post_ipo_promoter_holding_percent = 92.5,
    company_description = 'Jio Financial Services is a financial services company part of Reliance Industries, offering lending, insurance, and wealth management services.',
    industry_sector = 'Financial Services',
    key_highlights = '["Backed by Reliance Industries", "Tech-first financial services", "Pan-India digital reach", "Partnership with BlackRock"]'::jsonb,
    strengths = '["Strong parent company support", "Digital-first approach", "Massive customer base from Jio", "Low cost of acquisition"]'::jsonb,
    concerns = '["New entrant in financial services", "Competition from established players", "Regulatory uncertainties"]'::jsonb,
    expert_rating = 4.0,
    rating_financial_performance = 3.5,
    rating_valuation = 3.8,
    rating_growth_prospects = 4.5,
    rating_management_quality = 4.2,
    rating_industry_outlook = 4.0,
    expert_recommendation = 'Subscribe',
    risk_level = 'Medium',
    investment_horizon = 'Long-term'
WHERE ipo_name ILIKE '%Jio Financial%';

UPDATE public.ipos SET
    parent_company = 'Hyundai Motor Company, South Korea',
    drhp_status = 'approved',
    rhp_status = 'approved',
    sebi_status = 'Approved',
    pre_ipo_promoter_holding_percent = 100,
    post_ipo_promoter_holding_percent = 82.5,
    company_description = 'Hyundai Motor India is the second-largest car manufacturer in India, offering a wide range of vehicles from hatchbacks to SUVs.',
    industry_sector = 'Automobile',
    key_highlights = '["#2 car manufacturer in India", "Strong SUV portfolio (Creta, Venue)", "EV leadership with Ioniq", "Export hub for Hyundai global"]'::jsonb,
    strengths = '["Market leader in SUV segment", "Strong brand recall", "Wide dealer network", "Profitability leader in auto sector"]'::jsonb,
    concerns = '["Competition from Tata, Maruti", "EV transition challenges", "Chip shortage impact"]'::jsonb,
    expert_rating = 4.5,
    rating_financial_performance = 4.8,
    rating_valuation = 4.0,
    rating_growth_prospects = 4.2,
    rating_management_quality = 4.5,
    rating_industry_outlook = 4.0,
    expert_recommendation = 'Subscribe',
    risk_level = 'Low',
    investment_horizon = 'Long-term'
WHERE ipo_name ILIKE '%Hyundai%';

UPDATE public.ipos SET
    parent_company = 'NTPC Ltd',
    drhp_status = 'approved', 
    rhp_status = 'approved',
    sebi_status = 'Approved',
    pre_ipo_promoter_holding_percent = 100,
    post_ipo_promoter_holding_percent = 88.25,
    company_description = 'NTPC Green Energy is the renewable energy arm of NTPC, focusing on solar, wind, and green hydrogen projects.',
    industry_sector = 'Renewable Energy',
    key_highlights = '["Backed by NTPC (Maharatna PSU)", "15 GW renewable capacity target", "Green hydrogen focus", "Government backing for renewables"]'::jsonb,
    strengths = '["Strong parent company", "Government push for green energy", "Massive project pipeline", "Tech expertise from NTPC"]'::jsonb,
    concerns = '["Execution risks in renewable projects", "Land acquisition challenges", "Policy dependency"]'::jsonb,
    expert_rating = 4.0,
    rating_financial_performance = 3.5,
    rating_valuation = 4.0,
    rating_growth_prospects = 4.5,
    rating_management_quality = 4.0,
    rating_industry_outlook = 4.5,
    expert_recommendation = 'Subscribe for Long-term',
    risk_level = 'Medium',
    investment_horizon = 'Long-term'
WHERE ipo_name ILIKE '%NTPC Green%';

UPDATE public.ipos SET
    parent_company = 'Bundl Technologies Pvt Ltd',
    drhp_status = 'approved',
    rhp_status = 'approved',
    sebi_status = 'Approved',
    pre_ipo_promoter_holding_percent = 8.82,
    post_ipo_promoter_holding_percent = 6.51,
    company_description = 'Swiggy is one of leading food delivery and quick commerce platforms in India, operating Swiggy Food, Instamart, and Dineout.',
    industry_sector = 'E-commerce - Food Tech',
    key_highlights = '["Top 2 food delivery platform in India", "Quick commerce through Instamart", "Restaurant discovery via Dineout", "Strong unit economics improvements"]'::jsonb,
    strengths = '["Strong brand recognition", "Multiple revenue streams", "Improving unit economics", "Large customer base"]'::jsonb,
    concerns = '["Path to profitability", "Intense competition with Zomato", "High cash burn", "Gig worker regulations"]'::jsonb,
    expert_rating = 3.8,
    rating_financial_performance = 3.0,
    rating_valuation = 3.5,
    rating_growth_prospects = 4.5,
    rating_management_quality = 4.0,
    rating_industry_outlook = 4.0,
    expert_recommendation = 'Subscribe for Long-term',
    risk_level = 'High',
    investment_horizon = 'Long-term'
WHERE ipo_name ILIKE '%Swiggy%';

-- Insert sample GMP history
INSERT INTO public.gmp_history (ipo_id, ipo_name, gmp_amount, gmp_percentage, issue_price, expected_listing_price, recorded_at)
SELECT 
    id,
    ipo_name,
    FLOOR(RANDOM() * 100 + 20)::int,
    ROUND((RANDOM() * 30 + 5)::numeric, 2),
    max_price,
    max_price + FLOOR(RANDOM() * 100 + 20)::int,
    NOW() - (INTERVAL '1 day' * generate_series)
FROM public.ipos,
     generate_series(1, 10)
WHERE ipo_name ILIKE '%Tata Technologies%'
ON CONFLICT DO NOTHING;

-- Insert sample comments
INSERT INTO public.ipo_comments (ipo_id, user_name, user_email, comment_text, should_apply_vote, is_approved, created_at)
SELECT 
    id,
    'Investor ' || (ROW_NUMBER() OVER ()),
    'investor' || (ROW_NUMBER() OVER ()) || '@example.com',
    CASE (ROW_NUMBER() OVER ()) % 5
        WHEN 0 THEN 'Great IPO, strong fundamentals. Definitely applying!'
        WHEN 1 THEN 'Valuation seems stretched but long-term prospects are good.'
        WHEN 2 THEN 'Applied from multiple demat accounts. Hoping for allotment!'
        WHEN 3 THEN 'GMP is very high, might correct post listing. Be careful.'
        WHEN 4 THEN 'Solid company with good management. Subscribe for long term.'
    END,
    CASE WHEN RANDOM() > 0.3 THEN 'Yes' ELSE 'No' END,
    true,
    NOW() - (INTERVAL '1 hour' * (ROW_NUMBER() OVER ()))
FROM public.ipos
LIMIT 20
ON CONFLICT DO NOTHING;

-- Update allotment links with ipo_id
UPDATE public.ipo_allotment_links al
SET ipo_id = i.id
FROM public.ipos i
WHERE al.ipo_name ILIKE i.ipo_name
AND al.ipo_id IS NULL;

SELECT 'Data update complete! Check your tables.' as status;

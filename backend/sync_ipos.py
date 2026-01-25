"""
IPO Data Scraper - Scrapes real IPO data and upserts to Supabase 'ipos' table
"""

import os
import re
import requests
from bs4 import BeautifulSoup
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise Exception("Missing SUPABASE_URL or SUPABASE_KEY in .env")

supabase = create_client(supabase_url, supabase_key)

# ==================== HELPER FUNCTIONS ====================

def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return ""
    return text.replace('\n', '').replace('\t', '').strip()

def parse_number(text):
    """Extract number from text"""
    if not text or text == "-":
        return None
    text = str(text).replace(',', '').replace('₹', '').replace('Rs.', '')
    match = re.search(r'[\d.]+', text)
    return float(match.group()) if match else None

def create_slug(name):
    """Create URL-friendly slug from IPO name"""
    slug = name.lower()
    slug = re.sub(r'\(sme\)|\(mainboard\)|ipo|limited|ltd\.?|pvt\.?', '', slug)
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')

def parse_date(date_str):
    """Parse various date formats to YYYY-MM-DD"""
    if not date_str or date_str == "-":
        return None
    try:
        date_str = clean_text(date_str)
        for fmt in ['%b %d, %Y', '%d %b %Y', '%d-%b-%Y', '%d/%m/%Y', '%Y-%m-%d']:
            try:
                return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
            except:
                continue
    except:
        pass
    return None

# ==================== GMP SCRAPER (IPOWatch) ====================

def fetch_gmp_data():
    """Scrape GMP data from IPOWatch.in"""
    print("📡 Fetching GMP from IPOWatch.in...")
    
    url = "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"}
    
    gmp_dict = {}
    
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        tables = soup.find_all('table')
        if not tables:
            print("  ⚠️ No tables found")
            return {}
        
        rows = tables[0].find_all('tr')[1:]  # Skip header
        
        for row in rows[:20]:  # Limit to 20 IPOs
            cols = row.find_all('td')
            if len(cols) < 2:
                continue
            
            ipo_name = clean_text(cols[0].text)
            if not ipo_name:
                continue
                
            slug = create_slug(ipo_name)
            
            # Parse GMP
            gmp_text = clean_text(cols[1].text)
            gmp_amount = int(parse_number(gmp_text) or 0)
            
            # Parse price
            price = 0
            if len(cols) > 2:
                price = int(parse_number(cols[2].text) or 0)
            
            # Detect category
            category = "SME" if "SME" in ipo_name else "Mainboard"
            
            gmp_dict[slug] = {
                "ipo_name": ipo_name,
                "company_name": ipo_name.replace(" IPO", "").replace(" (SME)", "").strip(),
                "slug": slug,
                "category": category,
                "max_price": price,
                "current_gmp": gmp_amount,
                "gmp_updated_at": datetime.now().isoformat()
            }
        
        print(f"  ✅ Got GMP for {len(gmp_dict)} IPOs")
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    return gmp_dict

# ==================== DATES SCRAPER (Chittorgarh) ====================

def fetch_dates_data():
    """Scrape dates from Chittorgarh.com"""
    print("📅 Fetching dates from Chittorgarh.com...")
    
    url = "https://www.chittorgarh.com/ipo/ipo_dashboard.asp"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"}
    
    date_dict = {}
    
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        tables = soup.find_all('table')
        if not tables:
            print("  ⚠️ No tables found")
            return {}
        
        rows = tables[0].find_all('tr')[1:]
        
        for row in rows[:20]:
            cols = row.find_all('td')
            if len(cols) < 3:
                continue
            
            ipo_name = clean_text(cols[0].text)
            slug = create_slug(ipo_name)
            
            open_date = parse_date(cols[1].text) if len(cols) > 1 else None
            close_date = parse_date(cols[2].text) if len(cols) > 2 else None
            
            # Extract price range
            prices = []
            if len(cols) > 3:
                price_text = clean_text(cols[3].text)
                prices = re.findall(r'\d+', price_text)
            
            # Extract lot size
            lot_size = 100
            if len(cols) > 4:
                lot_size = int(parse_number(cols[4].text) or 100)
            
            # Extract issue size
            issue_size = None
            if len(cols) > 5:
                issue_size = parse_number(cols[5].text)
            
            date_dict[slug] = {
                "open_date": open_date,
                "close_date": close_date,
                "min_price": int(prices[0]) if len(prices) > 0 else None,
                "max_price": int(prices[-1]) if len(prices) > 0 else None,
                "lot_size": lot_size,
                "issue_size_cr": issue_size
            }
        
        print(f"  ✅ Got dates for {len(date_dict)} IPOs")
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    return date_dict

# ==================== SUBSCRIPTION SCRAPER ====================

def fetch_subscription_data():
    """Scrape subscription data from Chittorgarh"""
    print("📊 Fetching subscription data...")
    
    url = "https://www.chittorgarh.com/ipo/ipo_subscription_status_live.asp"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"}
    
    sub_dict = {}
    
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        table = soup.find('table', {'class': 'table'})
        if not table:
            return {}
        
        rows = table.find_all('tr')[1:]
        
        for row in rows[:10]:
            cols = row.find_all('td')
            if len(cols) < 5:
                continue
            
            name = clean_text(cols[0].text)
            slug = create_slug(name)
            
            sub_dict[slug] = {
                "subscription_retail": parse_number(cols[1].text) or 0,
                "subscription_nii": parse_number(cols[2].text) or 0,
                "subscription_qib": parse_number(cols[3].text) or 0,
                "subscription_total": parse_number(cols[4].text) or 0
            }
        
        print(f"  ✅ Got subscription for {len(sub_dict)} IPOs")
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    return sub_dict

# ==================== MERGE AND UPLOAD ====================

def merge_and_upload():
    """Merge all data sources and upload to Supabase"""
    
    # Fetch from all sources
    gmp_data = fetch_gmp_data()
    date_data = fetch_dates_data()
    sub_data = fetch_subscription_data()
    
    if not gmp_data and not date_data:
        print("\n❌ No data fetched from any source!")
        return
    
    # Merge data
    ipos = []
    all_slugs = set(gmp_data.keys()) | set(date_data.keys())
    
    for slug in all_slugs:
        gmp_info = gmp_data.get(slug, {})
        date_info = date_data.get(slug, {})
        sub_info = sub_data.get(slug, {})
        
        # Determine status based on dates
        status = "upcoming"
        today = datetime.now().strftime('%Y-%m-%d')
        open_date = date_info.get('open_date')
        close_date = date_info.get('close_date')
        
        if open_date and close_date:
            if today > close_date:
                status = "closed"
            elif today >= open_date and today <= close_date:
                status = "open"
        
        ipo = {
            "ipo_name": gmp_info.get('ipo_name') or slug.replace('-', ' ').title() + " IPO",
            "company_name": gmp_info.get('company_name') or slug.replace('-', ' ').title(),
            "slug": slug,
            "category": gmp_info.get('category', 'Mainboard'),
            "status": status,
            "open_date": date_info.get('open_date'),
            "close_date": date_info.get('close_date'),
            "min_price": date_info.get('min_price') or gmp_info.get('max_price'),
            "max_price": date_info.get('max_price') or gmp_info.get('max_price'),
            "lot_size": date_info.get('lot_size', 100),
            "issue_size_cr": date_info.get('issue_size_cr'),
            "current_gmp": gmp_info.get('current_gmp', 0),
            "subscription_retail": sub_info.get('subscription_retail'),
            "subscription_nii": sub_info.get('subscription_nii'),
            "subscription_qib": sub_info.get('subscription_qib'),
            "subscription_total": sub_info.get('subscription_total'),
            "updated_at": datetime.now().isoformat()
        }
        
        # Remove None values
        ipo = {k: v for k, v in ipo.items() if v is not None}
        ipos.append(ipo)
    
    print(f"\n📤 Uploading {len(ipos)} IPOs to Supabase...")
    
    # Upload to Supabase
    try:
        result = supabase.table('ipos').upsert(
            ipos,
            on_conflict='slug'
        ).execute()
        
        print(f"✅ SUCCESS! {len(ipos)} IPOs synced to database")
        print("\n📊 Sample records:")
        for ipo in ipos[:5]:
            print(f"  • {ipo['ipo_name']} | {ipo['status']} | GMP: ₹{ipo.get('current_gmp', 0)}")
        
    except Exception as e:
        print(f"❌ Upload Error: {e}")
        print("\n💡 If you see 'permission denied', you need to either:")
        print("   1. Use the Supabase service_role key (not anon key)")
        print("   2. Or add an INSERT policy to allow writes")
        print("\n   Run this SQL in Supabase SQL Editor:")
        print("   CREATE POLICY \"Allow inserts\" ON ipos FOR INSERT WITH CHECK (true);")
        print("   CREATE POLICY \"Allow updates\" ON ipos FOR UPDATE USING (true);")

# ==================== MAIN ====================

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 IPO Data Scraper - Starting...")
    print("=" * 60)
    
    merge_and_upload()
    
    print("\n" + "=" * 60)
    print("✅ Scraping complete!")
    print("=" * 60)

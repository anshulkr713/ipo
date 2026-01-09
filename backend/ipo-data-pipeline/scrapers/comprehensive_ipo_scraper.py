import os
import re
import time
import random
import requests
from bs4 import BeautifulSoup
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime
import json
import sys
sys.path.append('../..')
from scraper import fetch_gmp_data as old_scraper_gmp, fetch_dates_data as old_scraper_dates


load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

class SafeScraper:
    """Base scraper with anti-ban measures"""
    
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) Firefox/122.0"
    ]
    
    @staticmethod
    def random_delay():
        """Random delay between 2-5 seconds"""
        time.sleep(random.uniform(2, 5))
    
    @staticmethod
    def get_headers():
        return {
            "User-Agent": random.choice(SafeScraper.USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
    
    @staticmethod
    def fetch_url(url, max_retries=2):
        for attempt in range(max_retries):
            try:
                resp = requests.get(url, headers=SafeScraper.get_headers(), timeout=15)
                if resp.status_code == 200:
                    return resp
                time.sleep(3)
            except:
                time.sleep(3)
        return None

def clean_text(text):
    if not text: return ""
    return text.replace('\n', '').replace('\t', '').strip()

def parse_number(text):
    if not text or text == "-": return None
    text = str(text).replace(',', '').replace('₹', '').replace('Rs.', '')
    match = re.search(r'[\d.]+', text)
    return float(match.group()) if match else None

def create_slug(name):
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

# ==================== SOURCE 1: NSE OFFICIAL API ====================
def scrape_nse_api():
    """NSE Official API - Free, No Rate Limit Issues"""
    print("\n📡 Fetching from NSE Official API...")
    
    url = "https://www.nseindia.com/api/ipo-current-issues"
    
    # NSE requires cookies, so we simulate browser session
    session = requests.Session()
    session.get("https://www.nseindia.com", headers=SafeScraper.get_headers())
    SafeScraper.random_delay()
    
    try:
        resp = session.get(url, headers=SafeScraper.get_headers(), timeout=10)
        data = resp.json()
        
        ipos = []
        for ipo in data.get('data', []):
            try:
                ipos.append({
                    "ipo_name": ipo.get('companyName', '') + " IPO",
                    "company_name": ipo.get('companyName', ''),
                    "slug": create_slug(ipo.get('companyName', '')),
                    "category": "Mainboard",
                    "issue_size_cr": parse_number(ipo.get('issueSize')),
                    "min_price": int(parse_number(ipo.get('priceRangeMin')) or 0),
                    "max_price": int(parse_number(ipo.get('priceRangeMax')) or 0),
                    "lot_size": int(parse_number(ipo.get('lotSize')) or 1),
                    "open_date": parse_date(ipo.get('issueStartDate')),
                    "close_date": parse_date(ipo.get('issueEndDate')),
                    "listing_date": parse_date(ipo.get('listingDate')),
                    "status": "open" if ipo.get('status') == 'Active' else "upcoming"
                })
            except Exception as e:
                print(f"  ⚠️ Error parsing NSE IPO: {e}")
        
        print(f"  ✅ Got {len(ipos)} IPOs from NSE")
        return ipos
        
    except Exception as e:
        print(f"  ❌ NSE API failed: {e}")
        return []

# ==================== SOURCE 2: CHITTORGARH ====================
def scrape_chittorgarh():
    """Chittorgarh - Comprehensive IPO data"""
    print("\n🔄 Scraping Chittorgarh...")
    
    url = "https://www.chittorgarh.com/ipo/ipo_dashboard.asp"
    resp = SafeScraper.fetch_url(url)
    
    if not resp:
        print("  ❌ Failed to fetch")
        return []
    
    soup = BeautifulSoup(resp.text, 'html.parser')
    table = soup.find('table', {'class': 'table'})
    
    if not table:
        print("  ❌ Table not found")
        return []
    
    ipos = []
    rows = table.find_all('tr')[1:]
    
    for row in rows[:15]:  # Limit to avoid scraping too much
        try:
            cols = row.find_all('td')
            if len(cols) < 6: continue
            
            ipo_name = clean_text(cols[0].text)
            category = "SME" if "SME" in ipo_name else "Mainboard"
            
            # Extract price range
            price_text = clean_text(cols[3].text)
            prices = re.findall(r'\d+', price_text)
            
            ipos.append({
                "ipo_name": ipo_name,
                "company_name": ipo_name.replace(" IPO", "").replace(" (SME)", ""),
                "slug": create_slug(ipo_name),
                "category": category,
                "min_price": int(prices[0]) if len(prices) > 0 else None,
                "max_price": int(prices[-1]) if len(prices) > 0 else None,
                "lot_size": int(parse_number(cols[4].text) or 100),
                "open_date": parse_date(cols[1].text),
                "close_date": parse_date(cols[2].text),
                "issue_size_cr": parse_number(cols[5].text) if len(cols) > 5 else None,
                "status": "upcoming"
            })
            
        except Exception as e:
            continue
    
    print(f"  ✅ Got {len(ipos)} IPOs from Chittorgarh")
    SafeScraper.random_delay()
    return ipos

# ==================== SOURCE 3: GMP FROM IPOWATCH ====================
def scrape_gmp_data():
    """IPOWatch - GMP and Kostak"""
    print("\n💰 Scraping GMP from IPOWatch...")
    
    url = "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/"
    resp = SafeScraper.fetch_url(url)
    
    if not resp:
        return {}
    
    soup = BeautifulSoup(resp.text, 'html.parser')
    table = soup.find('table')
    
    if not table:
        return {}
    
    gmp_dict = {}
    rows = table.find_all('tr')[1:]
    
    for row in rows[:20]:  # Limit rows
        try:
            cols = row.find_all('td')
            if len(cols) < 3: continue
            
            name = clean_text(cols[0].text)
            slug = create_slug(name)
            
            gmp_text = clean_text(cols[1].text)
            gmp_amount = int(parse_number(gmp_text) or 0)
            
            # Extract percentage if present
            gmp_pct = None
            if '(' in gmp_text and '%' in gmp_text:
                pct_match = re.search(r'\(([\d.]+)%\)', gmp_text)
                if pct_match:
                    gmp_pct = float(pct_match.group(1))
            
            # Try to get kostak/sauda from additional columns
            kostak = None
            sauda = None
            if len(cols) > 3:
                kostak = int(parse_number(cols[3].text) or 0)
            if len(cols) > 4:
                sauda = int(parse_number(cols[4].text) or 0)
            
            gmp_dict[slug] = {
                "gmp_amount": gmp_amount,
                "gmp_percentage": gmp_pct,
                "kostak_rate": kostak,
                "subject_to_sauda": sauda,
                "gmp_updated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            continue
    
    print(f"  ✅ Got GMP for {len(gmp_dict)} IPOs")
    SafeScraper.random_delay()
    return gmp_dict

# ==================== SOURCE 4: SUBSCRIPTION DATA ====================
def scrape_subscription_data():
    """Chittorgarh - Live subscription"""
    print("\n📊 Scraping Subscription Data...")
    
    url = "https://www.chittorgarh.com/ipo/ipo_subscription_status_live.asp"
    resp = SafeScraper.fetch_url(url)
    
    if not resp:
        return {}
    
    soup = BeautifulSoup(resp.text, 'html.parser')
    table = soup.find('table', {'class': 'table'})
    
    if not table:
        return {}
    
    sub_dict = {}
    rows = table.find_all('tr')[1:]
    
    for row in rows[:10]:
        try:
            cols = row.find_all('td')
            if len(cols) < 6: continue
            
            name = clean_text(cols[0].text)
            slug = create_slug(name)
            
            sub_dict[slug] = {
                "subscription_retail": parse_number(cols[1].text) or 0,
                "subscription_nii": parse_number(cols[2].text) or 0,
                "subscription_qib": parse_number(cols[3].text) or 0,
                "subscription_total": parse_number(cols[4].text) or 0,
                "subscription_updated_at": datetime.now().isoformat()
            }
            
        except:
            continue
    
    print(f"  ✅ Got subscription for {len(sub_dict)} IPOs")
    SafeScraper.random_delay()
    return sub_dict

# ==================== SOURCE 5: FINANCIAL DATA (INVESTORGAIN) ====================
def scrape_financials():
    """InvestorGain - Company financials"""
    print("\n💼 Scraping Financial Data...")
    
    url = "https://www.investorgain.com/report/live-ipo-gmp/331/"
    resp = SafeScraper.fetch_url(url)
    
    if not resp:
        return {}
    
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    # InvestorGain has detailed pages per IPO
    # For now, we'll just grab basic data from listing page
    financials = {}
    
    try:
        rows = soup.find_all('tr')
        for row in rows[:15]:
            cols = row.find_all('td')
            if len(cols) < 4: continue
            
            name = clean_text(cols[0].text)
            slug = create_slug(name)
            
            # Try to extract PE ratio, issue size, etc.
            financials[slug] = {
                "issue_size_cr": parse_number(cols[2].text) if len(cols) > 2 else None,
                # More fields can be added by parsing individual IPO pages
            }
    except:
        pass
    
    print(f"  ✅ Got financials for {len(financials)} IPOs")
    SafeScraper.random_delay()
    return financials

# ==================== SOURCE 6: REGISTRAR & ALLOTMENT ====================
def scrape_registrar_info():
    """Get registrar details from Chittorgarh"""
    print("\n📋 Scraping Registrar Info...")
    
    url = "https://www.chittorgarh.com/ipo/ipo_registrars_list.asp"
    resp = SafeScraper.fetch_url(url)
    
    if not resp:
        return {}
    
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    registrar_map = {
        "link": "Link Intime India Pvt Ltd",
        "kfin": "KFin Technologies Ltd",
        "bigshare": "Bigshare Services Pvt Ltd"
    }
    
    # This would need to match IPO names to registrars
    # For simplicity, returning common registrars
    
    SafeScraper.random_delay()
    return {}

# ==================== MERGE & UPLOAD ====================
def merge_all_sources():
    print("\n🔄 Using working scrapers as fallback...")
    
    # Use your existing working scraper
    gmp_data = old_scraper_gmp()
    date_data = old_scraper_dates()
    
    ipos = []
    for item in gmp_data:
        slug = create_slug(item['ipo_name'])
        
        ipos.append({
            "ipo_name": item['ipo_name'],
            "company_name": item['ipo_name'].replace(' IPO', ''),
            "slug": slug,
            "category": item['category'],
            "status": "upcoming",
            "max_price": int(parse_number(item['ipo_price']) or 0),
            "lot_size": 100,
            "gmp_amount": int(parse_number(item['ipo_gmp']) or 0),
            "open_date": date_data.get(slug, {}).get('open_date'),
            "close_date": date_data.get(slug, {}).get('close_date')
        })
    
    return ipos


def upload_to_supabase(ipos):
    """Upload with proper error handling"""
    print(f"\n📤 Uploading {len(ipos)} IPOs to Supabase...")
    
    try:
        # Upsert (insert or update based on slug)
        result = supabase.table('ipos').upsert(
            ipos,
            on_conflict='slug'
        ).execute()
        
        print(f"✅ SUCCESS! Database updated")
        print(f"\n📊 Sample Records:")
        for ipo in ipos[:3]:
            print(f"  • {ipo['ipo_name']} | {ipo['status']} | GMP: ₹{ipo.get('gmp_amount', 0)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Upload Error: {e}")
        print(f"\n🔍 First record (for debugging):")
        if ipos:
            print(json.dumps(ipos[0], indent=2, default=str))
        return False

def main():
    """Main execution"""
    ipos = merge_all_sources()
    
    if ipos:
        upload_to_supabase(ipos)

    else:
        print("\n❌ No data collected!")

if __name__ == "__main__":
    main()
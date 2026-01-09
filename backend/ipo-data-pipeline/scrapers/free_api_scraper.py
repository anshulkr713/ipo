import os
import requests
import re
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# ==================== DATE PARSING LOGIC ====================

def clean_ordinal_date_string(date_str):
    """
    Parses complex strings like: "2026-01-13 06th – 08th Jan 2026"
    Returns standard YYYY-MM-DD strings for start and end dates.
    """
    if not date_str or date_str == '-': return None, None
    try:
        # 1. Clean the string (remove the leading ISO date if present)
        parts = date_str.split(' ', 1)
        text_range = parts[1] if len(parts) > 1 and re.match(r'\d{4}-\d{2}-\d{2}', parts[0]) else date_str

        # 2. Remove ordinals (st, nd, rd, th)
        clean_text = re.sub(r'(?<=\d)(st|nd|rd|th)', '', text_range)
        
        # 3. Split start/end
        if '–' in clean_text: sep = '–'
        elif '-' in clean_text: sep = '-'
        else: return None, None

        raw_start, raw_end = clean_text.split(sep, 1)
        raw_start, raw_end = raw_start.strip(), raw_end.strip()

        # 4. Parse End Date
        end_dt = datetime.strptime(raw_end, "%d %b %Y")
        
        # 5. Parse Start Date
        try:
            start_dt = datetime.strptime(raw_start, "%d %b %Y")
        except ValueError:
            # Handle short formats like "06" -> use month/year from end_dt
            day_part = int(re.search(r'\d+', raw_start).group())
            start_dt = end_dt.replace(day=day_part)

        return start_dt.strftime('%Y-%m-%d'), end_dt.strftime('%Y-%m-%d')

    except Exception as e:
        # Silently fail for bad dates so we don't crash
        return None, None

def clean_price(price_str):
    """Parses '₹76 – ₹81' -> (76, 81)"""
    if not price_str: return None, None
    nums = [int(p) for p in re.findall(r'\d+', str(price_str).replace(',', ''))]
    if not nums: return None, None
    if len(nums) == 1: return nums[0], nums[0]
    return nums[0], nums[-1]

def create_slug(name):
    if not name: return ""
    slug = name.lower()
    slug = re.sub(r'\(sme\)|\(mainboard\)|ipo|limited|ltd\.?|pvt\.?', '', slug)
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')

# ==================== MAIN SCRAPER ====================

def fetch_rapidapi_ipos():
    print("\n🇮🇳 Fetching from RapidAPI (Indian IPOs)...")
    
    api_key = os.getenv("RAPIDAPI_KEY")
    if not api_key: 
        print("❌ RAPIDAPI_KEY is missing.")
        return

    host = "indian-ipos1.p.rapidapi.com"
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": host
    }

    # We will fetch both endpoints to populate the DB
    endpoints = [
        {"url": f"https://{host}/upcoming-ipos", "status_tag": "upcoming"},
        {"url": f"https://{host}/closed-ipos", "status_tag": "closed"}
    ]
    
    all_valid_rows = []

    for ep in endpoints:
        try:
            print(f"  👉 Requesting {ep['status_tag']} IPOs...")
            resp = requests.get(ep['url'], headers=headers, timeout=15)
            
            # API returns a list directly or a dict with data?
            # Based on your logs, likely a list directly.
            raw_data = resp.json()
            
            # Normalize to list
            if isinstance(raw_data, dict) and 'data' in raw_data:
                items = raw_data['data']
            elif isinstance(raw_data, list):
                items = raw_data
            else:
                items = []

            print(f"     Found {len(items)} raw items.")

            for item in items:
                name = item.get('name')
                if not name: continue

                # 1. Strict Date Parsing
                open_date, close_date = clean_ordinal_date_string(item.get('ipoDate'))
                
                # SKIP if dates are missing (Supabase constraint violation)
                if not open_date or not close_date:
                    continue

                # 2. Parse Prices
                min_p, max_p = clean_price(item.get('priceRange'))
                
                # 3. Category & Listing Date
                category = "SME" if "SME" in name or "sme" in item.get('symbol', '').lower() else "Mainboard"
                
                listing_date = None
                if item.get('listingDate'):
                    try:
                        # Clean raw listing date "13 Jan 2026"
                        clean_l_date = re.sub(r'(st|nd|rd|th)', '', item.get('listingDate'))
                        listing_date = datetime.strptime(clean_l_date.strip(), "%d %b %Y").strftime("%Y-%m-%d")
                    except: pass

                # 4. Build Schema-Compliant Row
                row = {
                    "ipo_name": name,
                    "company_name": name,
                    "slug": create_slug(name),
                    "category": category,
                    "status": ep['status_tag'], # 'upcoming' or 'closed'
                    
                    # Financials
                    "min_price": min_p,
                    "max_price": max_p,
                    "lot_size": 1, # Defaulting to 1 as API doesn't provide it
                    
                    # Dates
                    "open_date": open_date,
                    "close_date": close_date,
                    "listing_date": listing_date,
                    
                    # Meta
                    "source": "rapidapi_indian_ipos",
                    "updated_at": datetime.now().isoformat()
                }
                all_valid_rows.append(row)

        except Exception as e:
            print(f"  ❌ Error fetching {ep['status_tag']}: {e}")

    # ================= SAVE TO DB =================
    
    if all_valid_rows:
        print(f"\n💾 Saving {len(all_valid_rows)} IPOs to Supabase...")
        try:
            # Deduplicate by slug before inserting (use the latest one)
            unique_map = {row['slug']: row for row in all_valid_rows}
            unique_rows = list(unique_map.values())
            
            result = supabase.table('ipos').upsert(
                unique_rows, 
                on_conflict='slug'
            ).execute()
            
            print(f"✅ Success! {len(unique_rows)} IPOs synced to database.")
        except Exception as e:
            print(f"❌ Database Error: {e}")
            if 'source' in str(e):
                print("💡 Remember to add the 'source' column to your table!")
    else:
        print("\n⚠️ No valid data found to save (check date parsing if items were found).")

if __name__ == "__main__":
    fetch_rapidapi_ipos()
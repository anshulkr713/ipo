import os
import requests
import difflib
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Setup
load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def clean_text(text):
    if not text: return "-"
    return text.replace('\n', '').strip()

# --- SCRAPER A: IPOWatch (For GMP & Price) ---
def fetch_gmp_data():
    print("Step 1: Fetching GMP from IPOWatch...")
    url = "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"}
    
    gmp_list = []
    try:
        resp = requests.get(url, headers=headers)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # They often change table IDs, so we grab the first table
        tables = soup.find_all('table')
        if not tables: return []

        rows = tables[0].find_all('tr')[1:] # Skip header
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 2: continue
            
            # Extract
            raw_name = clean_text(cols[0].text)
            gmp = clean_text(cols[1].text)
            price = "Check RHP"
            if len(cols) > 2: price = clean_text(cols[2].text) # Try grab price if exists
            
            # --- FIX FOR SME DETECTION ---
            # We look for "SME" in the name OR the category column if it exists
            category = "Mainboard"
            if "SME" in raw_name or "SME" in clean_text(row.text):
                category = "SME"
                
            # Listing Gain Calculation (approximate from text)
            # We extract just the text for now as you requested
            listing_gain = "-"
            if "(" in gmp:
                listing_gain = gmp.split("(")[-1].replace(")", "") # Extracts "50%" from "150 (50%)"
                gmp = gmp.split("(")[0].strip() # Keeps just "150"

            gmp_list.append({
                "match_name": raw_name.lower(), # For matching later
                "ipo_name": raw_name,
                "ipo_price": price,
                "ipo_gmp": gmp,
                "listing_gain": listing_gain,
                "category": category
            })
            
    except Exception as e:
        print(f"Error fetching GMP: {e}")
        
    return gmp_list

# --- SCRAPER B: Chittorgarh (For Dates) ---
def fetch_dates_data():
    print("Step 2: Fetching Dates from Chittorgarh...")
    url = "https://www.chittorgarh.com/ipo/ipo_dashboard.asp"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    date_map = {} # We will store data as { "name": {open, close} }
    try:
        resp = requests.get(url, headers=headers)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Chittorgarh usually has a table with class 'table'
        tables = soup.find_all('table')
        if not tables: return {}
        
        rows = tables[0].find_all('tr')[1:]
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 3: continue
            
            name = clean_text(cols[0].text)
            # Columns: 0=Name, 1=Date, etc. (Structure varies, usually Col 1 is Open Date)
            # Let's assume standard layout. You might need to adjust indices if they change.
            open_date = clean_text(cols[1].text) if len(cols) > 1 else "-"
            close_date = clean_text(cols[2].text) if len(cols) > 2 else "-"
            
            date_map[name.lower()] = {
                "open_date": open_date,
                "close_date": close_date
            }
            
    except Exception as e:
        print(f"Error fetching Dates: {e}")
        
    return date_map

# --- MAIN: COMBINE & UPLOAD ---
def run():
    # 1. Get Data
    gmp_data = fetch_gmp_data()
    date_data = fetch_dates_data()
    
    print(f"Got {len(gmp_data)} GMP records and {len(date_data)} Date records.")
    
    final_list = []
    
    # 2. Merge Loop
    for item in gmp_data:
        # Fuzzy Match: Try to find "Zepto IPO" inside "Zepto Limited"
        # We look for the closest match in the date_data keys
        
        best_match = difflib.get_close_matches(item['match_name'], date_data.keys(), n=1, cutoff=0.4)
        
        open_d = "-"
        close_d = "-"
        
        if best_match:
            matched_key = best_match[0]
            print(f"Matched: '{item['ipo_name']}' <--> '{matched_key}'")
            open_d = date_data[matched_key]['open_date']
            close_d = date_data[matched_key]['close_date']
        
        final_list.append({
            "ipo_name": item['ipo_name'],
            "category": item['category'],
            "ipo_price": item['ipo_price'],
            "ipo_gmp": item['ipo_gmp'],
            "listing_gain": item['listing_gain'],
            "open_date": open_d,
            "close_date": close_d
        })
        
    # 3. Upload
    if final_list:
        print(f"🚀 Uploading {len(final_list)} combined records...")
        supabase.table('ipo_gmp').delete().neq("id", 0).execute()
        supabase.table('ipo_gmp').insert(final_list).execute()
        print("Done!")

if __name__ == "__main__":
    run()
import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Setup Supabase
load_dotenv()
URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")

if not URL or not KEY:
    print("❌ Error: Missing Supabase credentials")
    exit()

supabase: Client = create_client(URL, KEY)

def clean_text(text):
    if not text: return ""
    return text.replace('\n', '').strip()

def scrape_shareholder_quota():
    print("--- Starting Shareholder Intel Scrape ---")
    url = "https://ipocentral.in/upcoming-ipos-with-shareholders-quota/"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            print(f"❌ Error: Website blocked us (Status {resp.status_code})")
            return

        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Locate the table with "Parent Company" in headers
        tables = soup.find_all('table')
        target_table = None
        
        for table in tables:
            headers_text = [th.get_text(strip=True).lower() for th in table.find_all('tr')[0].find_all(['th', 'td'])]
            if "parent company" in headers_text:
                target_table = table
                break
        
        if not target_table:
            print("❌ Error: Could not find the 'Shareholder Quota' table.")
            return

        print("✅ Found Shareholder Table. Parsing...")
        rows = target_table.find_all('tr')[1:] # Skip header
        
        data_to_insert = []
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 3: continue
            
            # Extract Columns based on the website structure:
            # Col 0: Subsidiary IPO Name
            # Col 1: Parent Company
            # Col 2: SEBI IPO Status
            
            ipo_name = clean_text(cols[0].text)
            parent = clean_text(cols[1].text)
            status = clean_text(cols[2].text)
            
            # Logic: Determine "Action Text" based on Status
            action = "Watchlist"
            is_active = True
            
            if "Approved" in status or "Filed" in status:
                action = f"Buy 1 share of {parent} ASAP (RHP likely soon)"
            elif "Awaited" in status:
                action = f"Track {parent} (Early Stage)"
            elif "Returned" in status or "Rejected" in status:
                is_active = False # Don't show these
                
            if is_active:
                data_to_insert.append({
                    "ipo_name": ipo_name,
                    "parent_company": parent,
                    "action_text": action,
                    "is_active": True,
                    # We leave rhp_date null as this site doesn't provide exact dates
                })

        # UPLOAD
        if data_to_insert:
            print(f"🚀 Inserting {len(data_to_insert)} Opportunities...")
            # Clear old data to prevent duplicates
            supabase.table('shareholder_intel').delete().neq("id", 0).execute()
            # Insert new
            supabase.table('shareholder_intel').insert(data_to_insert).execute()
            print("--- Success! Table Populated ---")
        else:
            print("⚠️ No valid rows found.")

    except Exception as e:
        print(f"❌ Critical Error: {e}")

if __name__ == "__main__":
    scrape_shareholder_quota()
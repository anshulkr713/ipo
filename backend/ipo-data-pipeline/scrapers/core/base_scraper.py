import os
import time
import random
import requests
from bs4 import BeautifulSoup
from abc import ABC, abstractmethod
from supabase import create_client, Client
from dotenv import load_dotenv
from functools import wraps

load_dotenv()

class BaseScraper(ABC):
    """Base class for all scrapers with common functionality"""
    
    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"), 
            os.getenv("SUPABASE_KEY")
        )
        self.session = requests.Session()
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0"
        ]
        
    def get_headers(self):
        """Rotate user agents to avoid blocking"""
        return {
            "User-Agent": random.choice(self.user_agents),
            "Accept": "text/html,application/json",
            "Accept-Language": "en-US,en;q=0.9"
        }
    
    def fetch_page(self, url, method="GET", data=None, max_retries=3):
        """Fetch page with retry logic"""
        for attempt in range(max_retries):
            try:
                if method == "GET":
                    resp = self.session.get(url, headers=self.get_headers(), timeout=10)
                else:
                    resp = self.session.post(url, headers=self.get_headers(), 
                                            data=data, timeout=10)
                
                if resp.status_code == 200:
                    return resp
                elif resp.status_code == 403:
                    print(f"⚠️  Blocked! Waiting {2 ** attempt}s...")
                    time.sleep(2 ** attempt)
                else:
                    print(f"❌ Status {resp.status_code}")
                    return None
                    
            except Exception as e:
                print(f"⚠️  Attempt {attempt + 1} failed: {e}")
                time.sleep(2 ** attempt)
        
        return None
    
    @staticmethod
    def clean_text(text):
        """Clean scraped text"""
        if not text:
            return ""
        return text.replace('\n', '').replace('\t', '').strip()
    
    @staticmethod
    def normalize_name(name):
        """Normalize IPO names for matching"""
        import re
        name = name.lower()
        name = re.sub(r'\(sme\)|\(mainboard\)|ipo|limited|ltd\.?|pvt\.?', '', name)
        name = re.sub(r'\s+', ' ', name)
        return name.strip()
    
    @staticmethod
    def parse_number(text):
        """Extract number from text like '5.2x', '₹150', '50%'"""
        import re
        if not text or text == "-":
            return None
        match = re.search(r'[\d,]+\.?\d*', text.replace(',', ''))
        return float(match.group()) if match else None
    
    def upsert_data(self, table, data, conflict_column='slug'):
        """Insert or update data in Supabase"""
        try:
            result = self.supabase.table(table).upsert(
                data, 
                on_conflict=conflict_column
            ).execute()
            print(f"✅ Upserted {len(data)} rows to {table}")
            return result
        except Exception as e:
            print(f"❌ DB Error: {e}")
            return None
    
    @abstractmethod
    def scrape(self):
        """Main scraping logic - must be implemented by child classes"""
        pass
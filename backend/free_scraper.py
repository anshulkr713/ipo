"""
Free Production-Ready IPO Scraper
Uses Playwright with advanced anti-detection + rotating free proxies
NO PAID SERVICES REQUIRED
"""

import asyncio
import logging
import random
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup
import os
from supabase import create_client
from dotenv import load_dotenv
import json
import sys

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# Fix Windows console encoding
if sys.platform == 'win32':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
logger = logging.getLogger(__name__)

# Load Environment Variables
load_dotenv()

# Initialize Supabase
try:
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
except Exception as e:
    logger.error(f"Failed to initialize Supabase: {e}")
    exit(1)


class FreeProxyManager:
    """Manages free proxy rotation"""
    FREE_PROXIES = [] # Add proxy strings "http://ip:port" here if needed
    
    def __init__(self):
        self.current_index = 0
        self.failed_proxies = set()
    
    def get_next_proxy(self) -> Optional[str]:
        if not self.FREE_PROXIES: return None
        attempts = 0
        while attempts < len(self.FREE_PROXIES):
            proxy = self.FREE_PROXIES[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.FREE_PROXIES)
            if proxy not in self.failed_proxies: return proxy
            attempts += 1
        return None
    
    def mark_failed(self, proxy: str):
        self.failed_proxies.add(proxy)

class StealthBrowser:
    """Browser with maximum stealth configuration"""
    
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    ]
    
    def __init__(self, proxy_manager: FreeProxyManager):
        self.browser: Optional[Browser] = None
        self.playwright = None
        self.proxy_manager = proxy_manager
    
    async def initialize(self):
        self.playwright = await async_playwright().start()
        launch_args = [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-features=IsolateOrigins,site-per-process',
        ]
        
        launch_options = {'headless': True, 'args': launch_args}
        proxy = self.proxy_manager.get_next_proxy()
        if proxy: launch_options['proxy'] = {'server': proxy}
        
        try:
            self.browser = await self.playwright.chromium.launch(**launch_options)
        except:
            if 'proxy' in launch_options: del launch_options['proxy']
            self.browser = await self.playwright.chromium.launch(**launch_options)
    
    async def create_stealth_page(self) -> Page:
        user_agent = random.choice(self.USER_AGENTS)
        context = await self.browser.new_context(
            user_agent=user_agent,
            viewport={'width': 1920, 'height': 1080},
            locale='en-IN',
            timezone_id='Asia/Kolkata'
        )
        page = await context.new_page()
        await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => false})")
        page.set_default_timeout(30000)
        return page
    
    async def fetch_with_retry(self, url: str, max_retries: int = 3) -> Optional[str]:
        for attempt in range(max_retries):
            page = None
            try:
                if attempt > 0: await asyncio.sleep(5)
                page = await self.create_stealth_page()
                logger.info(f"Fetching {url} (attempt {attempt + 1}/{max_retries})")
                
                response = await page.goto(url, wait_until='domcontentloaded')
                if response.status >= 400: continue
                
                await page.wait_for_load_state('networkidle', timeout=10000)
                return await page.content()
            except Exception as e:
                logger.warning(f"Attempt {attempt+1} failed: {e}")
                continue
            finally:
                if page: await page.close()
        return None
    
    async def close(self):
        if self.browser: await self.browser.close()
        if self.playwright: await self.playwright.stop()


class FreeIPOScraper:
    def __init__(self):
        self.browser = StealthBrowser(FreeProxyManager())
        self.stats = {'total_scraped': 0, 'total_errors': 0, 'sources': {}}
    
    async def initialize(self):
        await self.browser.initialize()

    # --- 1. GMP SCRAPER ---
    async def scrape_gmp_data(self) -> Dict[str, Any]:
        url = "https://www.chittorgarh.com/report/ipo-grey-market-premium-gmp-current-rate/83/"
        html = await self.browser.fetch_with_retry(url)
        if not html: return {}
        
        soup = BeautifulSoup(html, 'html.parser')
        gmp_data = {}
        
        # Find table
        target_table = None
        for table in soup.find_all('table'):
            if 'ipo' in table.get_text().lower() and 'gmp' in table.get_text().lower():
                target_table = table
                break
        
        if not target_table: return {}
        
        # Parse Rows (Increased limit to 100 to catch active IPOs buried under upcoming ones)
        rows = target_table.find_all('tr')[1:]
        for row in rows[:100]:
            try:
                cols = row.find_all('td')
                if len(cols) < 3: continue
                
                name = self._clean_text(cols[0].text)
                if not name: continue
                slug = self._create_slug(name)
                
                gmp_data[slug] = {
                    "ipo_name": name,
                    "company_name": name.replace(" IPO", "").strip(),
                    "max_price": self._parse_number(cols[1].text),
                    "gmp_amount": int(self._parse_number(cols[2].text) or 0),
                    "gmp_updated_at": datetime.now().isoformat(),
                    "scrape_source": "gmp"
                }
            except: continue
            
        self.stats['sources']['gmp'] = len(gmp_data)
        logger.info(f"[OK] Scraped {len(gmp_data)} from GMP source")
        return gmp_data

    # --- 2. SUBSCRIPTION SCRAPER ---
    async def scrape_subscription_data(self) -> Dict[str, Any]:
        url = "https://www.chittorgarh.com/report/ipo-subscription-status-live-bidding-data-bse-nse/21/"
        html = await self.browser.fetch_with_retry(url)
        if not html: return {}
        
        soup = BeautifulSoup(html, 'html.parser')
        sub_data = {}
        
        target_table = None
        for table in soup.find_all('table'):
            if 'qib' in table.get_text().lower():
                target_table = table
                break
                
        if not target_table: return {}
        
        rows = target_table.find_all('tr')[1:]
        for row in rows[:50]:
            try:
                cols = row.find_all('td')
                if len(cols) < 5: continue
                
                name = self._clean_text(cols[0].text)
                slug = self._create_slug(name)
                
                sub_data[slug] = {
                    "subscription_retail": self._parse_number(cols[1].text),
                    "subscription_nii": self._parse_number(cols[2].text),
                    "subscription_qib": self._parse_number(cols[3].text),
                    "subscription_total": self._parse_number(cols[4].text),
                    "subscription_updated_at": datetime.now().isoformat()
                }
            except: continue
            
        self.stats['sources']['sub'] = len(sub_data)
        logger.info(f"[OK] Scraped {len(sub_data)} from Subscription source")
        return sub_data

    # --- 3. DATES SCRAPER ---
    async def scrape_ipo_dates(self) -> Dict[str, Any]:
        url = "https://www.chittorgarh.com/ipo/ipo_dashboard.asp"
        html = await self.browser.fetch_with_retry(url)
        if not html: return {}
        
        soup = BeautifulSoup(html, 'html.parser')
        date_data = {}
        
        tables = soup.find_all('table')
        if not tables: return {}
        target_table = tables[0]
        
        rows = target_table.find_all('tr')[1:]
        for row in rows[:100]:
            try:
                cols = row.find_all('td')
                if len(cols) < 3: continue
                
                name = self._clean_text(cols[0].text)
                slug = self._create_slug(name)
                
                open_date = self._parse_date(cols[1].text)
                close_date = self._parse_date(cols[2].text)
                
                # Extract Issue Size/Lot Size if available
                lot_size = self._parse_number(cols[4].text) if len(cols) > 4 else 0
                
                date_data[slug] = {
                    "open_date": open_date,
                    "close_date": close_date,
                    "lot_size": int(lot_size) if lot_size else 1, # Default to 1 to satisfy DB
                    "status": self._determine_status(open_date, close_date)
                }
            except: continue
            
        self.stats['sources']['dates'] = len(date_data)
        logger.info(f"[OK] Scraped {len(date_data)} from Dates source")
        return date_data

    # --- MAIN MERGE & UPLOAD ---
    async def run_full_scrape(self) -> bool:
        try:
            await self.initialize()
            
            gmp_data = await self.scrape_gmp_data()
            sub_data = await self.scrape_subscription_data()
            date_data = await self.scrape_ipo_dates()
            
            all_slugs = set(gmp_data.keys()) | set(sub_data.keys()) | set(date_data.keys())
            merged_list = []
            
            # FUTURE DATE PLACEHOLDER (For DB NOT NULL constraint)
            # We set these 30 days in future so they show as "Upcoming"
            future_open = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
            future_close = (datetime.now() + timedelta(days=32)).strftime('%Y-%m-%d')
            
            for slug in all_slugs:
                item = {
                    "slug": slug,
                    "updated_at": datetime.now().isoformat(),
                    # Default values to satisfy DB constraints
                    "lot_size": 1,
                    "category": "Mainboard",
                    "status": "upcoming"
                }
                
                # Merge Sources
                g = gmp_data.get(slug, {})
                s = sub_data.get(slug, {})
                d = date_data.get(slug, {})
                
                # Name Priority
                item["ipo_name"] = g.get("ipo_name") or d.get("ipo_name") or slug.replace("-", " ").title() + " IPO"
                item["company_name"] = g.get("company_name") or item["ipo_name"].replace(" IPO", "")
                
                item.update(g)
                item.update(s)
                item.update(d)
                
                # --- CRITICAL FIX ---
                # If dates are missing (Upcoming IPOs), insert Placeholders
                # This prevents "Skipping..." and DB Error
                if not item.get("open_date") or not item.get("close_date"):
                    item["open_date"] = future_open
                    item["close_date"] = future_close
                    item["status"] = "upcoming" # Ensure status matches dates
                # --------------------

                merged_list.append(item)
            
            if not merged_list:
                logger.error("No data found to upload")
                return False
                
            logger.info(f"Uploading {len(merged_list)} IPOs to Supabase...")
            
            # Use chunks of 50 to avoid payload limits
            chunk_size = 50
            for i in range(0, len(merged_list), chunk_size):
                chunk = merged_list[i:i + chunk_size]
                supabase.table("ipos").upsert(chunk, on_conflict="slug").execute()
                logger.info(f"Uploaded chunk {i//chunk_size + 1}")
                
            logger.info("SUCCESS: All data uploaded.")
            return True
            
        except Exception as e:
            logger.error(f"Fatal Error: {e}")
            return False
        finally:
            await self.browser.close()

    # --- HELPERS ---
    def _clean_text(self, text):
        return ' '.join(text.strip().split()) if text else ""
        
    def _create_slug(self, text):
        import re
        s = re.sub(r'\(.*?\)|ipo|ltd|limited', '', text.lower())
        return re.sub(r'[^a-z0-9]+', '-', s).strip('-')
        
    def _parse_number(self, text):
        if not text: return None
        import re
        match = re.search(r'[\d.]+', text.replace(',', ''))
        return float(match.group()) if match else None
        
    def _parse_date(self, text):
        if not text or text in ['-', 'N/A']: return None
        text = self._clean_text(text)
        for fmt in ['%b %d, %Y', '%d %b %Y', '%Y-%m-%d']:
            try: return datetime.strptime(text, fmt).strftime('%Y-%m-%d')
            except: continue
        return None
    
    def _determine_status(self, open_d, close_d):
        if not open_d or not close_d: return "upcoming"
        today = datetime.now().strftime('%Y-%m-%d')
        if today > close_d: return "closed"
        if today >= open_d: return "open"
        return "upcoming"

if __name__ == "__main__":
    asyncio.run(FreeIPOScraper().run_full_scrape())
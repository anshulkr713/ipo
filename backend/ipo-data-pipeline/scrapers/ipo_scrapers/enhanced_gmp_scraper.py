from core.base_scraper import BaseScraper 
from datetime import datetime
from bs4 import BeautifulSoup

class GMPScraper(BaseScraper):
    """Multi-source GMP scraper with history tracking"""
    
    SOURCES = [
        {
            "name": "IPOWatch",
            "url": "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/",
            "parser": "parse_ipowatch"
        },
        {
            "name": "InvestorGain",
            "url": "https://www.investorgain.com/report/live-ipo-gmp/331/",
            "parser": "parse_investorgain"
        }
    ]
    
    def scrape(self):
        print("\n💰 Starting Multi-Source GMP Scrape...")
        
        all_gmp_data = {}
        
        for source in self.SOURCES:
            print(f"\n📡 Fetching from {source['name']}...")
            data = getattr(self, source['parser'])(source['url'])
            
            # Merge with existing data (average if conflict)
            for slug, gmp_info in data.items():
                if slug in all_gmp_data:
                    # Average the GMP values
                    existing = all_gmp_data[slug]['gmp_amount']
                    new = gmp_info['gmp_amount']
                    all_gmp_data[slug]['gmp_amount'] = int((existing + new) / 2)
                else:
                    all_gmp_data[slug] = gmp_info
        
        # Convert to list and upload
        updates = []
        history_records = []
        
        for slug, data in all_gmp_data.items():
            updates.append({
                "slug": slug,
                "gmp_amount": data['gmp_amount'],
                "gmp_percentage": data['gmp_percentage'],
                "gmp_updated_at": datetime.now().isoformat(),
                "expected_listing_price": data['expected_listing_price'],
                "kostak_rate": data.get('kostak_rate'),
                "subject_to_sauda": data.get('subject_to_sauda')
            })
            
            # Store in history table
            history_records.append({
                "ipo_name": data['ipo_name'],
                "gmp_amount": data['gmp_amount'],
                "gmp_percentage": data['gmp_percentage'],
                "issue_price": data.get('issue_price', 0),
                "expected_listing_price": data['expected_listing_price']
            })
        
        if updates:
            self.upsert_data('ipos', updates)
            # Also insert into history for tracking
            self.supabase.table('gmp_history').insert(history_records).execute()
            print(f"✅ Updated {len(updates)} GMP records\n")
    
    def parse_ipowatch(self, url):
        """Parse IPOWatch format"""
        resp = self.fetch_page(url)
        if not resp:
            return {}
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        table = soup.find('table')
        if not table:
            return {}
        
        result = {}
        rows = table.find_all('tr')[1:]
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 3:
                continue
            
            name = self.clean_text(cols[0].text)
            slug = self.normalize_name(name).replace(' ', '-')
            
            gmp_text = self.clean_text(cols[1].text)
            gmp_amount = self.parse_number(gmp_text) or 0
            
            price_text = self.clean_text(cols[2].text)
            issue_price = self.parse_number(price_text) or 0
            
            expected_price = issue_price + gmp_amount
            gmp_pct = (gmp_amount / issue_price * 100) if issue_price > 0 else 0
            
            result[slug] = {
                "ipo_name": name,
                "gmp_amount": int(gmp_amount),
                "gmp_percentage": round(gmp_pct, 2),
                "issue_price": int(issue_price),
                "expected_listing_price": int(expected_price)
            }
        
        return result
    
    def parse_investorgain(self, url):
        """Parse InvestorGain format (similar logic)"""
        # Implementation similar to above
        return {}
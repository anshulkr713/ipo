from ..core.base_scraper import BaseScraper
from datetime import datetime
import json

class SubscriptionScraper(BaseScraper):
    """Scrape live subscription data from Chittorgarh"""
    
    def scrape(self):
        print("\n🔄 Starting Subscription Scrape...")
        url = "https://www.chittorgarh.com/ipo/ipo_subscription_status_live.asp"
        
        resp = self.fetch_page(url)
        if not resp:
            print("❌ Failed to fetch subscription data")
            return
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Find the subscription table
        table = soup.find('table', {'class': 'table'})
        if not table:
            print("❌ Subscription table not found")
            return
        
        rows = table.find_all('tr')[1:]  # Skip header
        updates = []
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 7:
                continue
            
            try:
                ipo_name = self.clean_text(cols[0].text)
                
                # Parse subscription data
                retail = self.parse_number(cols[1].text) or 0
                nii = self.parse_number(cols[2].text) or 0
                bnii = self.parse_number(cols[3].text) or 0
                qib = self.parse_number(cols[4].text) or 0
                total = self.parse_number(cols[5].text) or 0
                
                # Create day-wise record
                day_record = {
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "time": datetime.now().strftime("%H:%M"),
                    "retail": retail,
                    "nii": nii,
                    "qib": qib,
                    "total": total
                }
                
                # Create slug
                slug = self.normalize_name(ipo_name).replace(' ', '-')
                
                update = {
                    "slug": slug,
                    "ipo_name": ipo_name,
                    "subscription_retail": retail,
                    "subscription_nii": nii,
                    "subscription_bnii": bnii,
                    "subscription_qib": qib,
                    "subscription_total": total,
                    "subscription_updated_at": datetime.now().isoformat(),
                    "day_wise_subscription": json.dumps([day_record])  # We'll append in next iteration
                }
                
                updates.append(update)
                print(f"📊 {ipo_name}: Total {total}x")
                
            except Exception as e:
                print(f"⚠️  Error parsing row: {e}")
                continue
        
        # Upload to database
        if updates:
            self.upsert_data('ipos', updates)
        
        print(f"✅ Updated {len(updates)} IPOs\n")
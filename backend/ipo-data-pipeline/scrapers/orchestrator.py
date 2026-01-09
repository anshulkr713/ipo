from apscheduler.schedulers.blocking import BlockingScheduler
from ipo_scrapers.subscription_scraper import SubscriptionScraper
from ipo_scrapers.enhanced_gmp_scraper import GMPScraper

def run_subscription_scraper():
    scraper = SubscriptionScraper()
    scraper.scrape()

def run_gmp_scraper():
    scraper = GMPScraper()
    scraper.scrape()

if __name__ == "__main__":
    scheduler = BlockingScheduler()
    
    # Run subscription scraper every 2 hours during market hours
    scheduler.add_job(run_subscription_scraper, 'cron', 
                      hour='9-17/2', day_of_week='mon-fri')
    
    # Run GMP scraper every 6 hours
    scheduler.add_job(run_gmp_scraper, 'interval', hours=6)
    
    print("🚀 Scheduler started. Press Ctrl+C to exit.")
    scheduler.start()
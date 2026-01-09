from apscheduler.schedulers.blocking import BlockingScheduler
import subprocess
import sys

def run_script(script_name):
    """Run scraper as subprocess"""
    print(f"\n{'='*60}")
    print(f"🤖 Running: {script_name}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            [sys.executable, f"scrapers/{script_name}"],
            capture_output=True,
            text=True,
            timeout=300
        )
        print(result.stdout)
        if result.stderr:
            print(f"⚠️ Errors: {result.stderr}")
    except Exception as e:
        print(f"❌ Error: {e}")

def run_api_fetcher():
    run_script("free_api_scraper.py")

def run_web_scraper():
    run_script("comprehensive_ipo_scraper.py")

if __name__ == "__main__":
    scheduler = BlockingScheduler()
    
    # API calls - Every 6 hours (rate limited)
    scheduler.add_job(
        run_api_fetcher,
        'interval',
        hours=6,
        id='api_fetch'
    )
    
    # Web scraping - Every 3 hours (unlimited)
    scheduler.add_job(
        run_web_scraper,
        'interval',
        hours=3,
        id='web_scrape'
    )
    
    print("🚀 Scheduler Started")
    print("  • API Fetch: Every 6 hours")
    print("  • Web Scrape: Every 3 hours")
    print("  Press Ctrl+C to stop\n")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\n👋 Stopped")
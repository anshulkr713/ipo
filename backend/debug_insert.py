"""Debug insert script"""
import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

# Force reload .env
load_dotenv(override=True)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')

print(f"URL: {url}")
print(f"Key (last 20 chars): ...{key[-20:]}")

supabase = create_client(url, key)

# Test IPO data
test_ipo = {
    'ipo_name': 'Test Debug IPO',
    'company_name': 'Test Debug Company',
    'slug': 'test-debug-' + datetime.now().strftime('%H%M%S'),
    'category': 'Mainboard',
    'status': 'upcoming',
    'open_date': '2026-01-30',
    'close_date': '2026-02-02',
    'min_price': 100,
    'max_price': 120,
    'lot_size': 50,
}

print(f"\nAttempting to insert: {test_ipo['slug']}")

try:
    result = supabase.table('ipos').insert(test_ipo).execute()
    print(f"SUCCESS!")
    print(f"Data: {result.data}")
except Exception as e:
    print(f"FAILED!")
    print(f"Error type: {type(e).__name__}")
    print(f"Error: {e}")

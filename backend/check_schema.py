"""Check what columns exist and test insert with minimal data"""
import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

# First, let's see what columns exist by fetching existing data
print("Fetching existing IPOs...")
result = supabase.table('ipos').select('*').limit(1).execute()

if result.data:
    print(f"Existing columns: {list(result.data[0].keys())}")
else:
    print("No existing data found")

# Try minimal insert matching existing schema
print("\nTrying minimal insert...")
minimal_ipo = {
    'ipo_name': 'Test Minimal IPO',
    'slug': 'test-minimal-' + datetime.now().strftime('%H%M%S'),
    'status': 'upcoming',
}

try:
    result = supabase.table('ipos').upsert(minimal_ipo, on_conflict='slug').execute()
    print(f"SUCCESS! Inserted: {result.data}")
except Exception as e:
    print(f"Error: {str(e)[:500]}")

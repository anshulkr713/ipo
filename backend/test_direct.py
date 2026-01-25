"""Test direct connection with hardcoded credentials"""
from supabase import create_client

url = 'https://ursmmtopuompthdnxznz.supabase.co'
key = '***REMOVED***'

print('Creating Supabase client with service_role key...')
supabase = create_client(url, key)

# Try to read data
print('Fetching IPOs...')
try:
    result = supabase.table('ipos').select('ipo_name, status').limit(5).execute()
    print(f'SUCCESS! Found {len(result.data)} IPOs')
    for ipo in result.data:
        print(f"  - {ipo['ipo_name']} ({ipo['status']})")
except Exception as e:
    print(f'SELECT Error: {e}')

# Try to insert
print('\nTrying insert...')
from datetime import datetime
test_ipo = {
    'ipo_name': 'NTPC Green Energy IPO',
    'company_name': 'NTPC Green Energy Limited',
    'slug': 'ntpc-green-energy',
    'category': 'Mainboard',
    'status': 'upcoming',
    'open_date': '2026-01-25',
    'close_date': '2026-01-28',
    'min_price': 102,
    'max_price': 108,
    'lot_size': 138,
}

try:
    result = supabase.table('ipos').upsert(test_ipo, on_conflict='slug').execute()
    print(f'INSERT SUCCESS!')
    print(f'Inserted: {result.data}')
except Exception as e:
    print(f'INSERT Error: {e}')

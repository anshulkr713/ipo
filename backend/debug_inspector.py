

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("="*80)
print("SUPABASE CONNECTION DIAGNOSTIC")
print("="*80)

# Check environment variables
print("\n[STEP 1] Checking environment variables...")
if not SUPABASE_URL:
    print("[ERROR] SUPABASE_URL not found in .env file")
    exit(1)
if not SUPABASE_KEY:
    print("[ERROR] SUPABASE_KEY not found in .env file")
    exit(1)

print(f"[OK] SUPABASE_URL: {SUPABASE_URL}")
print(f"[OK] SUPABASE_KEY: {SUPABASE_KEY[:20]}...{SUPABASE_KEY[-10:]}")

# Check key type
print("\n[STEP 2] Identifying key type...")
if 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' in SUPABASE_KEY:
    print("[INFO] This looks like a JWT token")
    
    # Decode to check role
    try:
        import base64
        import json
        
        # JWT format: header.payload.signature
        parts = SUPABASE_KEY.split('.')
        if len(parts) == 3:
            # Decode payload (add padding if needed)
            payload = parts[1]
            payload += '=' * (4 - len(payload) % 4)
            decoded = base64.b64decode(payload)
            token_data = json.loads(decoded)
            
            role = token_data.get('role', 'unknown')
            print(f"[INFO] Token role: {role}")
            
            if role == 'anon':
                print("[WARNING] You're using the ANON key!")
                print("[WARNING] The anon key has limited permissions")
                print("[ACTION REQUIRED] Switch to SERVICE_ROLE key for backend operations")
            elif role == 'service_role':
                print("[OK] You're using the SERVICE_ROLE key - this should work!")
            else:
                print(f"[INFO] Role '{role}' detected")
    except Exception as e:
        print(f"[WARNING] Could not decode token: {e}")
else:
    print("[WARNING] Key format not recognized")

# Test connection
print("\n[STEP 3] Testing connection...")
try:
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("[OK] Client created successfully")
except Exception as e:
    print(f"[ERROR] Failed to create client: {e}")
    exit(1)

# Test read permission
print("\n[STEP 4] Testing READ permission...")
try:
    result = client.table('ipos').select("slug").limit(1).execute()
    print(f"[OK] Can read from 'ipos' table")
    print(f"[INFO] Found {len(result.data)} row(s)")
except Exception as e:
    print(f"[ERROR] Cannot read from 'ipos' table: {e}")
    print("[ACTION] Check if table exists and RLS policies allow reading")

# Test write permission
print("\n[STEP 5] Testing WRITE permission...")
test_data = {
    "slug": "test-diagnostic-delete-me",
    "ipo_name": "Test IPO (DELETE ME)",
    "company_name": "Test Company",
    "category": "Mainboard",
    
    # ADD THIS LINE:
    "status": "upcoming",  
    
    "lot_size": 1,
    "open_date": "2026-01-01",
    "close_date": "2026-01-03"
}

try:
    result = client.table('ipos').insert(test_data).execute()
    print("[OK] Can INSERT into 'ipos' table!")
    
    # Clean up
    try:
        client.table('ipos').delete().eq('slug', 'test-diagnostic-delete-me').execute()
        print("[OK] Can DELETE from 'ipos' table!")
    except:
        print("[WARNING] Could not clean up test record")
    
except Exception as e:
    error_msg = str(e)
    print(f"[ERROR] Cannot write to 'ipos' table")
    print(f"[ERROR] Details: {error_msg}")
    
    if 'permission denied' in error_msg.lower():
        print("\n" + "="*80)
        print("PERMISSION DENIED - HERE'S HOW TO FIX IT")
        print("="*80)
        
        print("\nSOLUTION 1: Use SERVICE_ROLE Key (Recommended)")
        print("-" * 80)
        print("1. Go to Supabase Dashboard")
        print("2. Click on your project")
        print("3. Go to: Settings → API")
        print("4. Scroll down to 'Project API keys'")
        print("5. Find the 'service_role' section")
        print("6. Click 'Reveal' and copy the key")
        print("7. Update your .env file:")
        print("   SUPABASE_KEY=<paste-service-role-key-here>")
        print("8. Run this diagnostic again")
        
        print("\nSOLUTION 2: Add Database Policies")
        print("-" * 80)
        print("1. Go to Supabase Dashboard → SQL Editor")
        print("2. Run this SQL:\n")
        print("""
-- Enable RLS
ALTER TABLE public.ipos ENABLE ROW LEVEL SECURITY;

-- Add policy for service role
CREATE POLICY "Allow service role all operations" ON public.ipos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- If using anon key, also add:
CREATE POLICY "Allow anon insert" ON public.ipos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anon update" ON public.ipos
  FOR UPDATE
  USING (true);
        """)
        
        print("\nSOLUTION 3: Disable RLS (Not Recommended for Production)")
        print("-" * 80)
        print("Run this SQL in Supabase SQL Editor:")
        print("ALTER TABLE public.ipos DISABLE ROW LEVEL SECURITY;")
        print("\n[WARNING] This makes your table publicly writable!")
        print("[WARNING] Only use for development/testing")
        
    exit(1)

# Test upsert (what the scraper uses)
print("\n[STEP 6] Testing UPSERT permission...")
try:
    upsert_data = {
        "slug": "test-upsert-delete-me",
        "ipo_name": "Test Upsert IPO",
        "company_name": "Test Upsert Company",
        "category": "SME",
        
        # ADD THIS LINE:
        "status": "upcoming",
        
        "lot_size": 100,
        "open_date": "2026-01-01",
        "close_date": "2026-01-03"
    }
    
    result = client.table('ipos').upsert(upsert_data, on_conflict='slug').execute()
    print("[OK] Can UPSERT into 'ipos' table!")
    
    # Clean up
    client.table('ipos').delete().eq('slug', 'test-upsert-delete-me').execute()
    
except Exception as e:
    print(f"[ERROR] Cannot upsert to 'ipos' table: {e}")
    exit(1)

# All tests passed
print("\n" + "="*80)
print("SUCCESS - ALL PERMISSIONS WORKING!")
print("="*80)
print("\n[OK] Your Supabase configuration is correct")
print("[OK] The scraper should work now")
print("\nRun: python free_scraper.py")
print("="*80)
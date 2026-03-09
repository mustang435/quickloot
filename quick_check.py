#!/usr/bin/env python3
"""
Quick Status Check
"""

import requests

BASE_URL = "https://price-compare-test.preview.emergentagent.com/api"
ADMIN_PASSWORD = "quickloot_strong_password_123!"

def quick_status_check():
    """Quick check of current system status"""
    print("🔍 QUICK STATUS CHECK")
    print("=" * 40)
    
    # Test 1: Check if we can login now
    try:
        response = requests.post(f"{BASE_URL}/admin/login", 
                               json={"password": ADMIN_PASSWORD}, timeout=10)
        print(f"Admin login status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Admin login working")
            return True
        elif response.status_code == 429:
            data = response.json()
            print(f"❌ Still rate limited/locked: {data.get('error', '')}")
            return False
        else:
            print(f"❌ Other error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    quick_status_check()
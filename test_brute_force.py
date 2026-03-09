#!/usr/bin/env python3
"""
Isolated Brute Force Protection Test
"""

import requests
import time
import sys

BASE_URL = "https://price-compare-test.preview.emergentagent.com/api"
WRONG_PASSWORD = "wrong_password_for_brute_force_test"

def test_brute_force_isolated():
    """Test brute force protection in isolation"""
    print("🔒 Testing Brute Force Protection (Isolated)")
    print("Waiting 60 seconds for rate limits to reset...")
    time.sleep(60)
    
    try:
        print("\nMaking 3 failed login attempts...")
        
        # Make exactly 3 failed attempts
        for i in range(3):
            print(f"Attempt {i+1}/3...")
            response = requests.post(
                f"{BASE_URL}/admin/login",
                json={"password": WRONG_PASSWORD},
                timeout=10
            )
            print(f"  Status: {response.status_code}")
            if response.status_code in [200, 401]:
                data = response.json()
                print(f"  Response: {data}")
            time.sleep(2)  # Small delay between attempts
        
        print("\nMaking 4th attempt (should be locked)...")
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": WRONG_PASSWORD},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")
        
        if response.status_code == 429:
            if "locked" in data.get("error", "").lower():
                print("✅ PASS: Brute force protection working - account locked")
                return True
            else:
                print("❌ FAIL: Got 429 but wrong message format")
                return False
        else:
            print(f"❌ FAIL: Expected 429, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Error during test: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_brute_force_isolated()
    sys.exit(0 if success else 1)
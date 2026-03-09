#!/usr/bin/env python3
"""
Quick Header Test
"""

import requests

BASE_URL = "https://shop-compare-73.preview.emergentagent.com/api"

def test_headers():
    """Test security headers"""
    try:
        response = requests.get(f"{BASE_URL}/stats", timeout=10)
        
        print("All Response Headers:")
        for header, value in response.headers.items():
            print(f"  {header}: {value}")
            
        print(f"\nSpecific Security Headers:")
        print(f"X-Frame-Options: {response.headers.get('X-Frame-Options')}")
        print(f"X-Content-Type-Options: {response.headers.get('X-Content-Type-Options')}")
        print(f"X-XSS-Protection: {response.headers.get('X-XSS-Protection')}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_headers()
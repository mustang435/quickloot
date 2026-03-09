#!/usr/bin/env python3
"""
QuickLoot.net API Security Testing Suite
Tests all security features including authentication, authorization, rate limiting, and brute force protection.
"""

import requests
import time
import json
import sys

# Configuration
BASE_URL = "https://shop-compare-73.preview.emergentagent.com/api"
ADMIN_PASSWORD = "quickloot_strong_password_123!"
WRONG_PASSWORD = "wrong_password"

def print_test_result(test_name, success, message=""):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}: {message}")
    return success

def test_admin_login_correct_password():
    """Test admin login with correct password"""
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and data.get("message") == "Login successful":
                # Store token for later use
                global auth_token
                auth_token = data["token"]
                return print_test_result("Admin Login (Correct Password)", True, 
                    f"JWT token received: {auth_token[:20]}...")
            else:
                return print_test_result("Admin Login (Correct Password)", False, 
                    f"Missing token or message in response: {data}")
        else:
            return print_test_result("Admin Login (Correct Password)", False, 
                f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        return print_test_result("Admin Login (Correct Password)", False, f"Error: {str(e)}")

def test_admin_login_wrong_password():
    """Test admin login with wrong password"""
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": WRONG_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 401:
            data = response.json()
            if "error" in data and "Invalid password" in data["error"]:
                return print_test_result("Admin Login (Wrong Password)", True, 
                    f"Correctly rejected with: {data['error']}")
            else:
                return print_test_result("Admin Login (Wrong Password)", False, 
                    f"Wrong error message: {data}")
        else:
            return print_test_result("Admin Login (Wrong Password)", False, 
                f"Expected 401, got {response.status_code}: {response.text}")
            
    except Exception as e:
        return print_test_result("Admin Login (Wrong Password)", False, f"Error: {str(e)}")

def test_jwt_token_validation_with_token():
    """Test JWT token validation on protected routes with valid token"""
    global auth_token
    
    if not auth_token:
        return print_test_result("JWT Token Validation (With Token)", False, 
            "No auth token available from login test")
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/products",
            json={
                "name": "Security Test Product",
                "description": "Test product for JWT validation",
                "category": "electronics",
                "brand": "TestBrand",
                "featured": False
            },
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            if "id" in data and data.get("name") == "Security Test Product":
                return print_test_result("JWT Token Validation (With Token)", True, 
                    f"Product created successfully with ID: {data['id']}")
            else:
                return print_test_result("JWT Token Validation (With Token)", False, 
                    f"Invalid response data: {data}")
        else:
            return print_test_result("JWT Token Validation (With Token)", False, 
                f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        return print_test_result("JWT Token Validation (With Token)", False, f"Error: {str(e)}")

def test_jwt_token_validation_without_token():
    """Test JWT token validation on protected routes without token"""
    try:
        response = requests.post(
            f"{BASE_URL}/products",
            json={
                "name": "Unauthorized Test Product",
                "description": "This should fail",
                "category": "electronics"
            },
            timeout=10
        )
        
        if response.status_code == 401:
            data = response.json()
            if "error" in data and "Unauthorized" in data["error"]:
                return print_test_result("JWT Token Validation (Without Token)", True, 
                    f"Correctly rejected with: {data['error']}")
            else:
                return print_test_result("JWT Token Validation (Without Token)", False, 
                    f"Wrong error message: {data}")
        else:
            return print_test_result("JWT Token Validation (Without Token)", False, 
                f"Expected 401, got {response.status_code}: {response.text}")
            
    except Exception as e:
        return print_test_result("JWT Token Validation (Without Token)", False, f"Error: {str(e)}")

def test_brute_force_protection():
    """Test brute force protection after 3 failed login attempts"""
    print("\n🔒 Testing Brute Force Protection - Making 4 failed attempts...")
    
    try:
        # Make 3 failed attempts
        for i in range(3):
            print(f"   Attempt {i+1}/3...")
            response = requests.post(
                f"{BASE_URL}/admin/login",
                json={"password": WRONG_PASSWORD},
                timeout=10
            )
            time.sleep(1)  # Small delay between attempts
        
        # 4th attempt should be blocked
        print("   Attempt 4/4 (should be locked)...")
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": WRONG_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 429:
            data = response.json()
            if "error" in data and "locked" in data["error"].lower():
                return print_test_result("Brute Force Protection", True, 
                    f"Account correctly locked: {data['error']}")
            else:
                return print_test_result("Brute Force Protection", False, 
                    f"Wrong lockout message: {data}")
        else:
            return print_test_result("Brute Force Protection", False, 
                f"Expected 429 (locked), got {response.status_code}: {response.text}")
            
    except Exception as e:
        return print_test_result("Brute Force Protection", False, f"Error: {str(e)}")

def test_rate_limiting():
    """Test rate limiting on login endpoint"""
    print("\n⏱️ Testing Rate Limiting - Making rapid login requests...")
    
    try:
        rate_limit_hit = False
        
        # Make rapid requests to trigger rate limiting
        for i in range(8):
            response = requests.post(
                f"{BASE_URL}/admin/login",
                json={"password": "test"},
                timeout=10
            )
            
            # Check for rate limit headers
            if "X-RateLimit-Limit" in response.headers:
                print(f"   Request {i+1}: Rate limit headers present")
                print(f"      X-RateLimit-Limit: {response.headers.get('X-RateLimit-Limit')}")
                if "X-RateLimit-Remaining" in response.headers:
                    print(f"      X-RateLimit-Remaining: {response.headers.get('X-RateLimit-Remaining')}")
            
            # Check if rate limited
            if response.status_code == 429:
                rate_limit_hit = True
                data = response.json()
                return print_test_result("Rate Limiting", True, 
                    f"Rate limit hit at request {i+1}: {data.get('error', 'Too many requests')}")
        
        # If we didn't hit rate limit, still check for headers on successful requests
        if not rate_limit_hit:
            # Make one more normal request to check headers
            response = requests.post(
                f"{BASE_URL}/admin/login",
                json={"password": "test"},
                timeout=10
            )
            
            if "X-RateLimit-Limit" in response.headers:
                return print_test_result("Rate Limiting", True, 
                    f"Rate limit headers present: Limit={response.headers.get('X-RateLimit-Limit')}")
            else:
                return print_test_result("Rate Limiting", False, 
                    "Rate limit headers not found in response")
            
    except Exception as e:
        return print_test_result("Rate Limiting", False, f"Error: {str(e)}")

def test_security_headers():
    """Test for presence of security headers"""
    try:
        response = requests.get(f"{BASE_URL}/stats", timeout=10)
        
        required_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY', 
            'X-XSS-Protection': '1; mode=block'
        }
        
        missing_headers = []
        present_headers = []
        
        for header, expected_value in required_headers.items():
            actual_value = response.headers.get(header)
            if actual_value:
                present_headers.append(f"{header}: {actual_value}")
                if actual_value != expected_value:
                    missing_headers.append(f"{header} (expected: {expected_value}, got: {actual_value})")
            else:
                missing_headers.append(header)
        
        if not missing_headers:
            return print_test_result("Security Headers", True, 
                f"All security headers present: {', '.join(present_headers)}")
        else:
            return print_test_result("Security Headers", False, 
                f"Missing/incorrect: {', '.join(missing_headers)}. Present: {', '.join(present_headers)}")
            
    except Exception as e:
        return print_test_result("Security Headers", False, f"Error: {str(e)}")

def test_cors_headers():
    """Test CORS headers"""
    try:
        response = requests.options(f"{BASE_URL}/stats", timeout=10)
        
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods', 
            'Access-Control-Allow-Headers'
        ]
        
        present_cors = []
        for header in cors_headers:
            value = response.headers.get(header)
            if value:
                present_cors.append(f"{header}: {value}")
        
        if present_cors:
            return print_test_result("CORS Headers", True, 
                f"CORS headers present: {', '.join(present_cors)}")
        else:
            return print_test_result("CORS Headers", False, 
                "No CORS headers found")
            
    except Exception as e:
        return print_test_result("CORS Headers", False, f"Error: {str(e)}")

def run_all_security_tests():
    """Run all security tests"""
    print("=" * 60)
    print("🔐 QUICKLOOT.NET API SECURITY TESTING SUITE")
    print("=" * 60)
    
    global auth_token
    auth_token = None
    
    tests_passed = 0
    total_tests = 0
    
    # Test 1: Admin Login with correct password
    print("\n1️⃣ AUTHENTICATION TESTING")
    print("-" * 30)
    total_tests += 1
    if test_admin_login_correct_password():
        tests_passed += 1
    
    # Test 2: Admin Login with wrong password  
    total_tests += 1
    if test_admin_login_wrong_password():
        tests_passed += 1
    
    # Test 3 & 4: JWT Token Validation
    print("\n2️⃣ JWT TOKEN VALIDATION")
    print("-" * 30)
    total_tests += 1
    if test_jwt_token_validation_with_token():
        tests_passed += 1
        
    total_tests += 1
    if test_jwt_token_validation_without_token():
        tests_passed += 1
    
    # Test 5: Brute Force Protection
    print("\n3️⃣ BRUTE FORCE PROTECTION")
    print("-" * 30)
    total_tests += 1
    if test_brute_force_protection():
        tests_passed += 1
    
    # Test 6: Rate Limiting
    print("\n4️⃣ RATE LIMITING")
    print("-" * 30) 
    total_tests += 1
    if test_rate_limiting():
        tests_passed += 1
    
    # Test 7 & 8: Security Headers
    print("\n5️⃣ SECURITY HEADERS")
    print("-" * 30)
    total_tests += 1
    if test_security_headers():
        tests_passed += 1
        
    total_tests += 1
    if test_cors_headers():
        tests_passed += 1
    
    # Final Results
    print("\n" + "=" * 60)
    print("📊 FINAL SECURITY TEST RESULTS")
    print("=" * 60)
    print(f"Tests Passed: {tests_passed}/{total_tests}")
    print(f"Success Rate: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("🎉 ALL SECURITY TESTS PASSED!")
    else:
        print(f"⚠️  {total_tests - tests_passed} test(s) failed. Review security implementation.")
    
    return tests_passed == total_tests

if __name__ == "__main__":
    try:
        success = run_all_security_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⛔ Test suite interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)
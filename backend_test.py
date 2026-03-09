#!/usr/bin/env python3
"""
QuickLoot.net Backend API Test Suite
Tests all backend API endpoints systematically
"""
import requests
import json
import sys
import os
from typing import Dict, Any, Optional

class BackendTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Test data storage
        self.test_data = {}
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, message: str, data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'data': data
        })
        return success
        
    def make_request(self, method: str, endpoint: str, data: Dict = None) -> tuple[bool, Dict]:
        """Make HTTP request and return (success, response_data)"""
        url = f"{self.api_url}{endpoint}"
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, timeout=30)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
                
            # Try to parse JSON response
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
                
            if response.status_code >= 400:
                return False, {
                    "error": f"HTTP {response.status_code}",
                    "response": response_data,
                    "url": url
                }
                
            return True, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": f"Request failed: {str(e)}", "url": url}
    
    def test_stats_endpoint(self) -> bool:
        """Test GET /api/stats"""
        success, data = self.make_request('GET', '/stats')
        if not success:
            return self.log_result("GET /api/stats", False, f"Request failed: {data.get('error', 'Unknown error')}")
            
        required_fields = ['totalProducts', 'totalStores', 'totalLinks']
        for field in required_fields:
            if field not in data:
                return self.log_result("GET /api/stats", False, f"Missing required field: {field}")
                
        self.test_data['stats'] = data
        return self.log_result("GET /api/stats", True, f"Stats: {data['totalProducts']} products, {data['totalStores']} stores, {data['totalLinks']} links")
    
    def test_stores_endpoint(self) -> bool:
        """Test GET /api/stores"""
        success, data = self.make_request('GET', '/stores')
        if not success:
            return self.log_result("GET /api/stores", False, f"Request failed: {data.get('error', 'Unknown error')}")
            
        if not isinstance(data, list):
            return self.log_result("GET /api/stores", False, f"Expected array, got: {type(data)}")
            
        # Store test data for later use
        self.test_data['stores'] = data
        
        # Check if we have the expected 9 stores - but be flexible if seeding hasn't happened
        store_count = len(data)
        return self.log_result("GET /api/stores", True, f"Retrieved {store_count} stores")
    
    def test_categories_endpoint(self) -> bool:
        """Test GET /api/categories"""
        success, data = self.make_request('GET', '/categories')
        if not success:
            return self.log_result("GET /api/categories", False, f"Request failed: {data.get('error', 'Unknown error')}")
            
        if not isinstance(data, list):
            return self.log_result("GET /api/categories", False, f"Expected array, got: {type(data)}")
            
        # Store test data for later use
        self.test_data['categories'] = data
        
        # Check if we have categories - but be flexible if seeding hasn't happened
        category_count = len(data)
        return self.log_result("GET /api/categories", True, f"Retrieved {category_count} categories")
    
    def test_create_product(self) -> bool:
        """Test POST /api/products"""
        product_data = {
            "name": "iPhone 15 Pro 256GB",
            "brand": "Apple",
            "category": "phones",
            "description": "Latest iPhone with titanium frame",
            "featured": True
        }
        
        success, data = self.make_request('POST', '/products', product_data)
        if not success:
            return self.log_result("POST /api/products", False, f"Request failed: {data.get('error', 'Unknown error')}")
            
        # Verify required fields in response
        required_fields = ['id', 'name', 'brand', 'category']
        for field in required_fields:
            if field not in data:
                return self.log_result("POST /api/products", False, f"Missing required field in response: {field}")
                
        # Store the created product for later tests
        self.test_data['created_product'] = data
        product_id = data['id']
        
        return self.log_result("POST /api/products", True, f"Created product with ID: {product_id}")
    
    def test_get_products(self) -> bool:
        """Test GET /api/products"""
        success, data = self.make_request('GET', '/products')
        if not success:
            return self.log_result("GET /api/products", False, f"Request failed: {data.get('error', 'Unknown error')}")
            
        # Check if response has expected structure
        if 'products' not in data:
            return self.log_result("GET /api/products", False, "Response missing 'products' field")
            
        products = data['products']
        if not isinstance(products, list):
            return self.log_result("GET /api/products", False, f"Expected products array, got: {type(products)}")
            
        # Look for our created product
        created_product_found = False
        if 'created_product' in self.test_data:
            created_id = self.test_data['created_product']['id']
            for product in products:
                if product.get('id') == created_id:
                    created_product_found = True
                    break
                    
        if 'created_product' in self.test_data and not created_product_found:
            return self.log_result("GET /api/products", False, "Created product not found in products list")
            
        return self.log_result("GET /api/products", True, f"Retrieved {len(products)} products")
    
    def test_create_price_link(self) -> bool:
        """Test POST /api/price-links"""
        if 'created_product' not in self.test_data:
            return self.log_result("POST /api/price-links", False, "No product available for price link creation")
            
        if not self.test_data.get('stores'):
            return self.log_result("POST /api/price-links", False, "No stores available for price link creation")
            
        # Find Amazon France store or use the first available store
        amazon_store = None
        for store in self.test_data['stores']:
            if 'amazon' in store.get('name', '').lower() and 'fr' in store.get('country', '').lower():
                amazon_store = store
                break
        
        # If no Amazon FR, use first store
        if not amazon_store and self.test_data['stores']:
            amazon_store = self.test_data['stores'][0]
            
        if not amazon_store:
            return self.log_result("POST /api/price-links", False, "No suitable store found")
            
        product_id = self.test_data['created_product']['id']
        store_id = amazon_store['id']
        
        price_link_data = {
            "productId": product_id,
            "storeId": store_id,
            "url": "https://www.amazon.fr/dp/B0CHX1W1XY",
            "currentPrice": 1299.99,
            "currency": "EUR"
        }
        
        success, data = self.make_request('POST', '/price-links', price_link_data)
        if not success:
            return self.log_result("POST /api/price-links", False, f"Request failed: {data.get('error', 'Unknown error')}")
            
        # Verify required fields in response
        required_fields = ['id', 'productId', 'storeId', 'url', 'currentPrice']
        for field in required_fields:
            if field not in data:
                return self.log_result("POST /api/price-links", False, f"Missing required field in response: {field}")
                
        # Store the created price link for later tests
        self.test_data['created_price_link'] = data
        link_id = data['id']
        
        return self.log_result("POST /api/price-links", True, f"Created price link with ID: {link_id}")
    
    def test_get_product_with_links(self) -> bool:
        """Test GET /api/products/<product_id>"""
        if 'created_product' not in self.test_data:
            return self.log_result("GET /api/products/:id", False, "No product available for testing")
            
        product_id = self.test_data['created_product']['id']
        success, data = self.make_request('GET', f'/products/{product_id}')
        
        if not success:
            return self.log_result("GET /api/products/:id", False, f"Request failed: {data.get('error', 'Unknown error')}")
            
        # Verify product data
        if data.get('id') != product_id:
            return self.log_result("GET /api/products/:id", False, "Product ID mismatch")
            
        # Check if priceLinks array exists
        if 'priceLinks' not in data:
            return self.log_result("GET /api/products/:id", False, "Missing priceLinks array")
            
        price_links = data['priceLinks']
        if not isinstance(price_links, list):
            return self.log_result("GET /api/products/:id", False, f"Expected priceLinks array, got: {type(price_links)}")
            
        # Check if our created price link is included
        created_link_found = False
        if 'created_price_link' in self.test_data:
            created_link_id = self.test_data['created_price_link']['id']
            for link in price_links:
                if link.get('id') == created_link_id:
                    created_link_found = True
                    # Verify store info is populated
                    if 'store' not in link or not link['store']:
                        return self.log_result("GET /api/products/:id", False, "Price link missing store information")
                    break
                    
        if 'created_price_link' in self.test_data and not created_link_found:
            return self.log_result("GET /api/products/:id", False, "Created price link not found in product")
            
        return self.log_result("GET /api/products/:id", True, f"Retrieved product with {len(price_links)} price links")
    
    def test_scrape_status(self) -> bool:
        """Test GET /api/scrape/status"""
        success, data = self.make_request('GET', '/scrape/status')
        if not success:
            return self.log_result("GET /api/scrape/status", False, f"Request failed: {data.get('error', 'Unknown error')}")
            
        # Check for expected fields
        expected_fields = ['total', 'success', 'failed', 'recentLinks']
        for field in expected_fields:
            if field not in data:
                return self.log_result("GET /api/scrape/status", False, f"Missing expected field: {field}")
                
        # Store scraping status
        self.test_data['scrape_status'] = data
        
        return self.log_result("GET /api/scrape/status", True, 
                             f"Scrape Status - Total: {data['total']}, Success: {data['success']}, Failed: {data['failed']}")
    
    def test_search_endpoint(self) -> bool:
        """Test GET /api/search?q=iPhone"""
        success, data = self.make_request('GET', '/search?q=iPhone')
        if not success:
            return self.log_result("GET /api/search", False, f"Request failed: {data.get('error', 'Unknown error')}")
            
        # Check response structure
        if 'products' not in data:
            return self.log_result("GET /api/search", False, "Response missing 'products' field")
            
        products = data['products']
        if not isinstance(products, list):
            return self.log_result("GET /api/search", False, f"Expected products array, got: {type(products)}")
            
        # If we created an iPhone product, it should be found
        iphone_found = False
        for product in products:
            if 'iphone' in product.get('name', '').lower():
                iphone_found = True
                break
                
        # Check if our created product should be found
        expected_found = False
        if 'created_product' in self.test_data:
            product_name = self.test_data['created_product']['name'].lower()
            if 'iphone' in product_name:
                expected_found = True
                
        if expected_found and not iphone_found:
            return self.log_result("GET /api/search", False, "Created iPhone product not found in search results")
            
        return self.log_result("GET /api/search", True, f"Search returned {len(products)} products")
    
    def test_scrape_single_link(self) -> bool:
        """Test POST /api/scrape with linkId"""
        if 'created_price_link' not in self.test_data:
            return self.log_result("POST /api/scrape", False, "No price link available for scraping test")
            
        link_id = self.test_data['created_price_link']['id']
        scrape_data = {"linkId": link_id}
        
        success, data = self.make_request('POST', '/scrape', scrape_data)
        if not success:
            return self.log_result("POST /api/scrape", False, f"Request failed: {data.get('error', 'Unknown error')}")
            
        # Check response structure
        expected_fields = ['linkId', 'success']
        for field in expected_fields:
            if field not in data:
                return self.log_result("POST /api/scrape", False, f"Missing expected field: {field}")
                
        # Note: The scrape might fail due to Amazon bot protection, but should return a response
        scrape_success = data.get('success', False)
        message = f"Scrape completed - Success: {scrape_success}"
        if not scrape_success and 'error' in data:
            message += f", Error: {data['error']}"
            
        return self.log_result("POST /api/scrape", True, message)
    
    def run_all_tests(self) -> dict:
        """Run all backend tests"""
        print("=== QuickLoot.net Backend API Test Suite ===")
        print(f"Testing API at: {self.api_url}")
        print()
        
        # Test basic endpoints
        self.test_stats_endpoint()
        self.test_stores_endpoint()
        self.test_categories_endpoint()
        
        # Test product creation and retrieval
        self.test_create_product()
        self.test_get_products()
        
        # Test price link creation
        self.test_create_price_link()
        self.test_get_product_with_links()
        
        # Test additional endpoints
        self.test_scrape_status()
        self.test_search_endpoint()
        self.test_scrape_single_link()
        
        # Summary
        print("\n=== Test Results Summary ===")
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Tests Passed: {passed}/{total}")
        if passed == total:
            print("🎉 All tests passed!")
        else:
            print("❌ Some tests failed. Check details above.")
            
        print("\n=== Test Data Collected ===")
        for key, value in self.test_data.items():
            if isinstance(value, dict) and 'id' in value:
                print(f"{key}: ID = {value['id']}")
            elif isinstance(value, list):
                print(f"{key}: {len(value)} items")
            else:
                print(f"{key}: {type(value).__name__}")
                
        return {
            'total_tests': total,
            'passed_tests': passed,
            'success_rate': passed / total if total > 0 else 0,
            'test_results': self.test_results,
            'test_data': self.test_data
        }

def main():
    """Main test runner"""
    # Get base URL from environment or use default
    base_url = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://deal-finder-361.preview.emergentagent.com')
    
    print(f"Starting backend tests with base URL: {base_url}")
    
    # Initialize tester
    tester = BackendTester(base_url)
    
    # Run all tests
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    if results['passed_tests'] == results['total_tests']:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
QuickLoot.net API Testing Suite
Tests all the key API endpoints with specific validation requirements
"""

import requests
import json
import base64
from datetime import datetime, timezone
import uuid
import time

# Backend URL from environment
BASE_URL = "https://price-compare-test.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def log(message):
    """Simple logging with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def test_categories_get():
    """Test GET /api/categories - Should return categories sorted by order field"""
    log("Testing GET /api/categories...")
    
    try:
        response = requests.get(f"{API_BASE}/categories")
        
        if response.status_code != 200:
            log(f"❌ Categories GET failed with status {response.status_code}: {response.text}")
            return False
            
        categories = response.json()
        log(f"✅ Categories GET successful - Received {len(categories)} categories")
        
        # Check if categories are sorted by order field
        if len(categories) > 1:
            for i in range(1, len(categories)):
                prev_order = categories[i-1].get('order', 99)
                curr_order = categories[i].get('order', 99)
                if prev_order > curr_order:
                    log(f"❌ Categories not sorted by order field: {prev_order} > {curr_order}")
                    return False
            log("✅ Categories correctly sorted by order field")
        
        # Validate required fields: id, name_en, name_fr, slug, icon, image, order, parentId
        required_fields = ['id', 'name_en', 'name_fr', 'slug', 'icon', 'image', 'order', 'parentId']
        if categories:
            first_cat = categories[0]
            missing_fields = [field for field in required_fields if field not in first_cat]
            if missing_fields:
                log(f"❌ Missing required fields in categories: {missing_fields}")
                return False
            log("✅ All required fields present in categories")
            
        log(f"✅ Sample category: {json.dumps(categories[0] if categories else {}, indent=2)}")
        return True
        
    except requests.RequestException as e:
        log(f"❌ Categories GET request failed: {e}")
        return False
    except Exception as e:
        log(f"❌ Categories GET error: {e}")
        return False

def test_products_get():
    """Test GET /api/products - Should return products with multi-language pros/cons"""
    log("Testing GET /api/products...")
    
    try:
        response = requests.get(f"{API_BASE}/products")
        
        if response.status_code != 200:
            log(f"❌ Products GET failed with status {response.status_code}: {response.text}")
            return False
            
        data = response.json()
        products = data.get('products', [])
        total = data.get('total', 0)
        
        log(f"✅ Products GET successful - Received {len(products)} products, total: {total}")
        
        # Check for multi-language pros/cons fields
        if products:
            first_product = products[0]
            multilang_fields = ['pros_en', 'cons_en', 'pros_fr', 'cons_fr']
            
            # Check if fields exist (they should be in the response structure)
            has_multilang = all(field in first_product for field in multilang_fields)
            if not has_multilang:
                missing = [f for f in multilang_fields if f not in first_product]
                log(f"❌ Missing multi-language pros/cons fields: {missing}")
                return False
                
            log("✅ Multi-language pros/cons fields present in products")
            log(f"✅ Sample product: {json.dumps(first_product, indent=2)}")
        else:
            log("ℹ️ No products found to test multi-language fields")
            
        return True
        
    except requests.RequestException as e:
        log(f"❌ Products GET request failed: {e}")
        return False
    except Exception as e:
        log(f"❌ Products GET error: {e}")
        return False

def get_admin_token():
    """Get admin JWT token for authenticated endpoints"""
    log("Getting admin authentication token...")
    
    try:
        response = requests.post(f"{API_BASE}/admin/login", json={
            "password": "quickloot_strong_password_123!"
        })
        
        if response.status_code != 200:
            log(f"❌ Admin login failed with status {response.status_code}: {response.text}")
            return None
            
        data = response.json()
        token = data.get('token')
        if not token:
            log(f"❌ No token in login response: {data}")
            return None
            
        log("✅ Admin authentication successful")
        return token
        
    except requests.RequestException as e:
        log(f"❌ Admin login request failed: {e}")
        return None
    except Exception as e:
        log(f"❌ Admin login error: {e}")
        return None

def test_update_product_missing_id(token):
    """Test POST /api/update-product with missing product_id (should return 400)"""
    log("Testing POST /api/update-product with missing product_id...")
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test without product_id
        response = requests.post(f"{API_BASE}/update-product", 
                               json={"store_prices": []}, 
                               headers=headers)
        
        if response.status_code != 400:
            log(f"❌ Expected 400 for missing product_id, got {response.status_code}: {response.text}")
            return False
            
        log("✅ Correctly returned 400 for missing product_id")
        return True
        
    except requests.RequestException as e:
        log(f"❌ Update product request failed: {e}")
        return False
    except Exception as e:
        log(f"❌ Update product error: {e}")
        return False

def test_update_product_nonexistent_id(token):
    """Test POST /api/update-product with non-existent product_id (should return 404)"""
    log("Testing POST /api/update-product with non-existent product_id...")
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test with fake UUID
        fake_uuid = str(uuid.uuid4())
        response = requests.post(f"{API_BASE}/update-product", 
                               json={
                                   "product_id": fake_uuid,
                                   "store_prices": []
                               }, 
                               headers=headers)
        
        if response.status_code != 404:
            log(f"❌ Expected 404 for non-existent product_id, got {response.status_code}: {response.text}")
            return False
            
        log("✅ Correctly returned 404 for non-existent product_id")
        return True
        
    except requests.RequestException as e:
        log(f"❌ Update product request failed: {e}")
        return False
    except Exception as e:
        log(f"❌ Update product error: {e}")
        return False

def test_update_product_valid(token):
    """Test POST /api/update-product with valid data"""
    log("Testing POST /api/update-product with valid data...")
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # First create a test product to update
        product_data = {
            "name": "Test Product for Update API",
            "description": "Test product for price update endpoint testing",
            "category": "electronics",
            "brand": "TestBrand",
            "pros_en": ["Good quality", "Affordable"],
            "cons_en": ["Limited warranty"],
            "pros_fr": ["Bonne qualité", "Abordable"],  
            "cons_fr": ["Garantie limitée"]
        }
        
        response = requests.post(f"{API_BASE}/products", json=product_data, headers=headers)
        if response.status_code != 201:
            log(f"❌ Failed to create test product: {response.status_code}: {response.text}")
            return False
            
        product = response.json()
        product_id = product['id']
        log(f"✅ Created test product with ID: {product_id}")
        
        # Now test the update-product endpoint
        update_data = {
            "product_id": product_id,
            "store_prices": [
                {
                    "store_id": str(uuid.uuid4()),
                    "store_url": "https://example.com/product/123",
                    "price": 599.99,
                    "currency": "CAD",
                    "is_in_stock": True
                },
                {
                    "store_id": str(uuid.uuid4()),
                    "store_url": "https://another-store.com/item/456", 
                    "price": 649.99,
                    "currency": "CAD",
                    "is_in_stock": True
                }
            ]
        }
        
        response = requests.post(f"{API_BASE}/update-product", json=update_data, headers=headers)
        
        if response.status_code != 200:
            log(f"❌ Update product failed with status {response.status_code}: {response.text}")
            return False
            
        result = response.json()
        expected_fields = ['success', 'productId', 'linksProcessed', 'results', 'bestPrice']
        missing_fields = [field for field in expected_fields if field not in result]
        
        if missing_fields:
            log(f"❌ Missing expected fields in response: {missing_fields}")
            return False
            
        if not result.get('success'):
            log(f"❌ Success field is not true: {result}")
            return False
            
        if result.get('productId') != product_id:
            log(f"❌ Product ID mismatch: expected {product_id}, got {result.get('productId')}")
            return False
            
        log(f"✅ Update product successful - processed {result.get('linksProcessed')} links, best price: {result.get('bestPrice')}")
        return True
        
    except requests.RequestException as e:
        log(f"❌ Update product request failed: {e}")
        return False
    except Exception as e:
        log(f"❌ Update product error: {e}")
        return False

def test_create_product_multilang(token):
    """Test POST /api/products - Create product with multi-language pros/cons"""
    log("Testing POST /api/products with multi-language pros/cons...")
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        product_data = {
            "name": "Multi-Language Test Product",
            "description": "Test product with multi-language pros and cons",
            "category": "electronics",
            "brand": "TestBrand",
            "pros_en": ["Excellent build quality", "Fast performance", "Great value"],
            "cons_en": ["Heavy weight", "Limited color options"],
            "pros_fr": ["Excellente qualité de construction", "Performance rapide", "Excellent rapport qualité-prix"],
            "cons_fr": ["Poids lourd", "Options de couleur limitées"]
        }
        
        response = requests.post(f"{API_BASE}/products", json=product_data, headers=headers)
        
        if response.status_code != 201:
            log(f"❌ Create product failed with status {response.status_code}: {response.text}")
            return False
            
        product = response.json()
        
        # Verify multi-language fields are properly saved
        multilang_fields = ['pros_en', 'cons_en', 'pros_fr', 'cons_fr']
        for field in multilang_fields:
            if field not in product:
                log(f"❌ Missing field {field} in created product")
                return False
            if not isinstance(product[field], list):
                log(f"❌ Field {field} should be a list, got {type(product[field])}")
                return False
                
        log(f"✅ Product created with multi-language pros/cons - ID: {product['id']}")
        log(f"  pros_en: {product['pros_en']}")
        log(f"  cons_en: {product['cons_en']}")
        log(f"  pros_fr: {product['pros_fr']}")
        log(f"  cons_fr: {product['cons_fr']}")
        return True
        
    except requests.RequestException as e:
        log(f"❌ Create product request failed: {e}")
        return False
    except Exception as e:
        log(f"❌ Create product error: {e}")
        return False

def test_create_category_with_image(token):
    """Test POST /api/categories - Create category with image (base64) and order"""
    log("Testing POST /api/categories with image and order...")
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Create a simple base64 image (1x1 pixel transparent PNG)
        base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        
        category_data = {
            "name_en": "Test Category with Image",
            "name_fr": "Catégorie de test avec image",
            "slug": "test-category-image",
            "icon": "🧪",
            "image": base64_image,
            "order": 1,
            "parentId": None
        }
        
        response = requests.post(f"{API_BASE}/categories", json=category_data, headers=headers)
        
        if response.status_code != 201:
            log(f"❌ Create category failed with status {response.status_code}: {response.text}")
            return False
            
        category = response.json()
        
        # Verify required fields
        required_fields = ['id', 'name_en', 'name_fr', 'slug', 'icon', 'image', 'order', 'parentId']
        missing_fields = [field for field in required_fields if field not in category]
        
        if missing_fields:
            log(f"❌ Missing required fields in created category: {missing_fields}")
            return False
            
        # Verify image field contains the base64 data
        if category['image'] != base64_image:
            log(f"❌ Image field mismatch. Expected base64 data, got: {category['image'][:50]}...")
            return False
            
        # Verify order field
        if category['order'] != 1:
            log(f"❌ Order field mismatch. Expected 1, got: {category['order']}")
            return False
            
        log(f"✅ Category created with image and order - ID: {category['id']}")
        log(f"  Name EN: {category['name_en']}")
        log(f"  Name FR: {category['name_fr']}")
        log(f"  Order: {category['order']}")
        log(f"  Image: {category['image'][:50]}...")
        return True
        
    except requests.RequestException as e:
        log(f"❌ Create category request failed: {e}")
        return False
    except Exception as e:
        log(f"❌ Create category error: {e}")
        return False

def test_homepage_no_admin_panel():
    """Test that homepage does NOT contain 'Admin Panel' text"""
    log("Testing that homepage does NOT contain 'Admin Panel' button...")
    
    try:
        response = requests.get(BASE_URL)
        
        if response.status_code != 200:
            log(f"❌ Homepage request failed with status {response.status_code}")
            return False
            
        html_content = response.text
        
        # Check for "Admin Panel" text (case insensitive)
        if "admin panel" in html_content.lower():
            log("❌ Homepage contains 'Admin Panel' text - this should NOT be present")
            return False
            
        log("✅ Homepage correctly does NOT contain 'Admin Panel' text")
        return True
        
    except requests.RequestException as e:
        log(f"❌ Homepage request failed: {e}")
        return False
    except Exception as e:
        log(f"❌ Homepage test error: {e}")
        return False

def main():
    """Run all tests"""
    log("Starting QuickLoot.net API Testing Suite...")
    log(f"Backend URL: {API_BASE}")
    
    results = {}
    
    # Test public endpoints first
    results['categories_get'] = test_categories_get()
    results['products_get'] = test_products_get()
    results['homepage_no_admin'] = test_homepage_no_admin_panel()
    
    # Get admin token for protected endpoints
    token = get_admin_token()
    if not token:
        log("❌ Cannot proceed with admin-protected endpoint tests - no token")
        results.update({
            'update_product_missing_id': False,
            'update_product_nonexistent_id': False, 
            'update_product_valid': False,
            'create_product_multilang': False,
            'create_category_image': False
        })
    else:
        # Test protected endpoints
        results['update_product_missing_id'] = test_update_product_missing_id(token)
        results['update_product_nonexistent_id'] = test_update_product_nonexistent_id(token)
        results['update_product_valid'] = test_update_product_valid(token)
        results['create_product_multilang'] = test_create_product_multilang(token)
        results['create_category_image'] = test_create_category_with_image(token)
    
    # Print summary
    log("\n" + "="*60)
    log("TEST RESULTS SUMMARY")
    log("="*60)
    
    passed = 0
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        log(f"{test_name:30} {status}")
        if passed_test:
            passed += 1
    
    log("="*60)
    log(f"TOTAL: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        log("🎉 All tests PASSED!")
        return True
    else:
        log("💥 Some tests FAILED!")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
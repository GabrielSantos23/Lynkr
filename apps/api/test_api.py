import requests
import json
import time
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.user_id = None
        self.user_email = None
        self.folder_id = None
        self.bookmark_id = None
        self.test_results = {
            "passed": [],
            "failed": [],
            "errors": []
        }
    
    def log_result(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        if success:
            self.test_results["passed"].append(f"{test_name}: {message}")
            print(f"✅ {test_name}: {message}")
        else:
            self.test_results["failed"].append(f"{test_name}: {message}")
            print(f"❌ {test_name}: {message}")
    
    def log_error(self, test_name: str, error: str):
        """Log test error"""
        self.test_results["errors"].append(f"{test_name}: {error}")
        print(f"🔥 {test_name}: ERROR - {error}")
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{API_URL}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Health Check", True, f"Status: {data.get('status')}")
                return True
            else:
                self.log_result("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Health Check", str(e))
            return False
    
    def test_register(self):
        """Test user registration"""
        try:
            test_email = f"test_{int(time.time())}@example.com"
            register_data = {
                "name": "Test User",
                "email": test_email,
                "password": "testpassword123"
            }
            
            response = self.session.post(f"{API_URL}/auth/register", json=register_data)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.user_id = data["user"]["id"]
                self.user_email = test_email
                self.log_result("User Registration", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_result("User Registration", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_error("User Registration", str(e))
            return False
    
    def test_login(self):
        """Test user login"""
        try:
            # Use the same email that was registered
            login_data = {
                "email": self.user_email,
                "password": "testpassword123"
            }
            
            response = self.session.post(f"{API_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.user_id = data["user"]["id"]
                self.log_result("User Login", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_result("User Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_error("User Login", str(e))
            return False
    
    def test_get_current_user(self):
        """Test get current user endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.get(f"{API_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Current User", True, f"Name: {data.get('name')}")
                return True
            else:
                self.log_result("Get Current User", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Get Current User", str(e))
            return False
    
    def test_create_folder(self):
        """Test create folder endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            folder_data = {
                "name": "Test Folder",
                "icon": "📁",
                "allow_duplicate": True,
                "is_shared": False
            }
            
            response = self.session.post(f"{API_URL}/folders", json=folder_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.folder_id = data["id"]
                self.log_result("Create Folder", True, f"Folder ID: {self.folder_id}")
                return True
            else:
                self.log_result("Create Folder", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_error("Create Folder", str(e))
            return False
    
    def test_get_folders(self):
        """Test get folders endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.get(f"{API_URL}/folders", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Folders", True, f"Found {len(data)} folders")
                return True
            else:
                self.log_result("Get Folders", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Get Folders", str(e))
            return False
    
    def test_get_folder(self):
        """Test get specific folder endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.get(f"{API_URL}/folders/{self.folder_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Folder", True, f"Folder: {data.get('name')}")
                return True
            else:
                self.log_result("Get Folder", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Get Folder", str(e))
            return False
    
    def test_create_bookmark(self):
        """Test create bookmark endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            bookmark_data = {
                "url": "https://example.com",
                "title": "Example Bookmark",
                "folder_id": self.folder_id,
                "favicon_url": "https://example.com/favicon.ico",
                "og_image_url": "https://example.com/image.jpg",
                "description": "This is a test bookmark",
                "is_pinned": False,
                "tags": [
                    {"name": "test", "color": "#ff0000"},
                    {"name": "example", "color": "#00ff00"}
                ]
            }
            
            response = self.session.post(f"{API_URL}/bookmarks", json=bookmark_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.bookmark_id = data["id"]
                self.log_result("Create Bookmark", True, f"Bookmark ID: {self.bookmark_id}")
                return True
            else:
                self.log_result("Create Bookmark", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_error("Create Bookmark", str(e))
            return False
    
    def test_get_bookmarks(self):
        """Test get bookmarks endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.get(f"{API_URL}/bookmarks", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Bookmarks", True, f"Found {len(data)} bookmarks")
                return True
            else:
                self.log_result("Get Bookmarks", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Get Bookmarks", str(e))
            return False
    
    def test_get_bookmarks_by_folder(self):
        """Test get bookmarks by folder endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.get(f"{API_URL}/bookmarks/folder/{self.folder_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Bookmarks by Folder", True, f"Found {len(data)} bookmarks")
                return True
            else:
                self.log_result("Get Bookmarks by Folder", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Get Bookmarks by Folder", str(e))
            return False
    
    def test_get_bookmark(self):
        """Test get specific bookmark endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.get(f"{API_URL}/bookmarks/{self.bookmark_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Bookmark", True, f"Title: {data.get('title')}")
                return True
            else:
                self.log_result("Get Bookmark", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Get Bookmark", str(e))
            return False
    
    def test_encryption(self):
        """Test encryption/decryption functionality"""
        try:
            from encryption import encryption_service
            
            test_text = "This is a test string for encryption"
            encrypted = encryption_service.encrypt(test_text)
            decrypted = encryption_service.decrypt(encrypted)
            
            if decrypted == test_text:
                self.log_result("Encryption Test", True, "Encryption/decryption working correctly")
                return True
            else:
                self.log_result("Encryption Test", False, "Decrypted text doesn't match original")
                return False
        except Exception as e:
            self.log_error("Encryption Test", str(e))
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting API Tests...")
        print("=" * 50)
        
        # Test encryption first
        self.test_encryption()
        
        # Test health check
        if not self.test_health_check():
            print("❌ Health check failed. Make sure the API server is running.")
            return
        
        # Test authentication
        print("\n📝 Testing Authentication...")
        self.test_register()
        self.test_login()
        self.test_get_current_user()
        
        # Test folders
        print("\n📁 Testing Folders...")
        self.test_create_folder()
        self.test_get_folders()
        self.test_get_folder()
        
        # Test bookmarks
        print("\n🔖 Testing Bookmarks...")
        self.test_create_bookmark()
        self.test_get_bookmarks()
        self.test_get_bookmarks_by_folder()
        self.test_get_bookmark()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results["passed"]) + len(self.test_results["failed"]) + len(self.test_results["errors"])
        passed = len(self.test_results["passed"])
        failed = len(self.test_results["failed"])
        errors = len(self.test_results["errors"])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"🔥 Errors: {errors}")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for test in self.test_results["failed"]:
                print(f"  - {test}")
        
        if errors > 0:
            print("\n🔥 Errors:")
            for error in self.test_results["errors"]:
                print(f"  - {error}")
        
        success_rate = (passed / total_tests * 100) if total_tests > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 Excellent! API is working great!")
        elif success_rate >= 70:
            print("👍 Good! Most features are working.")
        elif success_rate >= 50:
            print("⚠️  Some issues detected. Check failed tests.")
        else:
            print("🚨 Major issues detected. Review errors and failed tests.")

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()

import requests
import sys
import json
from datetime import datetime

class GymLogAPITester:
    def __init__(self, base_url="https://fittracker-109.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = f"test_user_{datetime.now().strftime('%H%M%S')}"

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error Response: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Error Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test(
            "API Root",
            "GET",
            "api/",
            200
        )

    def test_backup_create(self):
        """Test creating a backup"""
        backup_data = {
            "userId": self.user_id,
            "exercises": [
                {
                    "id": "1",
                    "name": "Test Squat",
                    "muscle": "Legs",
                    "created_at": datetime.now().isoformat()
                }
            ],
            "logs": [
                {
                    "id": "1",
                    "exercise_id": "1",
                    "timestamp": datetime.now().isoformat(),
                    "sets": [
                        {"reps": 5, "weight": 100.0}
                    ]
                }
            ]
        }
        
        return self.run_test(
            "Create Backup",
            "POST",
            "api/backup",
            200,
            data=backup_data
        )

    def test_backup_retrieve(self):
        """Test retrieving a backup"""
        return self.run_test(
            "Retrieve Backup",
            "GET",
            f"api/backup/{self.user_id}",
            200
        )

def main():
    print("🏋️ Starting GymLog API Tests...")
    tester = GymLogAPITester()

    # Test API root
    tester.test_api_root()

    # Test backup creation
    tester.test_backup_create()

    # Test backup retrieval
    tester.test_backup_retrieve()

    # Print results
    print(f"\n📊 Tests Summary:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("❌ Some backend tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
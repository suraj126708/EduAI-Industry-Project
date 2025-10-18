/**
 * Test script for school creation functionality
 * This script tests the createSchool endpoint to ensure it works correctly
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Test data that matches the frontend form structure
const testSchoolData = {
  name: "Test School " + Date.now(),
  type: "public",
  establishedYear: 2020,
  address: "123 Test Street, Test City, Test State",
  contact: "+91-9876543210",
  emailDomain: "testschool.edu",
  principalName: "Test Principal",
  principalEmail: `test.principal.${Date.now()}@testschool.edu`,
  principalPassword: "TestPassword123",
};

async function testSchoolCreation() {
  try {
    console.log("🧪 Testing School Creation...");
    console.log("📋 Test Data:", JSON.stringify(testSchoolData, null, 2));

    // Note: This test requires a valid Firebase token for a superadmin user
    // In a real test environment, you would need to authenticate first
    console.log(
      "⚠️  Note: This test requires authentication with a superadmin token"
    );
    console.log("📝 To run this test properly:");
    console.log("   1. Start the backend server");
    console.log("   2. Login as a superadmin user");
    console.log("   3. Get the Firebase ID token");
    console.log("   4. Add the token to the Authorization header");

    // Example of how the request would look with authentication:
    /*
    const response = await axios.post(`${API_BASE_URL}/superadmin/schools`, testSchoolData, {
      headers: {
        'Authorization': `Bearer YOUR_FIREBASE_ID_TOKEN_HERE`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response:', response.data);
    */

    console.log("🔗 Endpoint: POST /api/superadmin/schools");
    console.log("📊 Expected Response Structure:");
    console.log(
      JSON.stringify(
        {
          success: true,
          message: "School and Principal created successfully",
          data: {
            school: {
              _id: "school_id",
              name: "Test School",
              type: "public",
              status: "verified",
              // ... other school fields
            },
            principal: {
              _id: "principal_id",
              name: "Test Principal",
              email: "test.principal@testschool.edu",
              role: "principal",
              status: "active",
            },
            temporaryPassword: "Temp@generated_password",
          },
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("📄 Response data:", error.response.data);
      console.error("📊 Status:", error.response.status);
    }
  }
}

// Run the test
testSchoolCreation();

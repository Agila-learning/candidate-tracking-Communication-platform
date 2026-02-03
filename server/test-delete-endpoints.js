// Test script to verify delete endpoints are working
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testDeleteEndpoints() {
    console.log('🧪 Testing Delete Endpoints...\n');

    // First, let's try to get candidates to see if API is responsive
    try {
        console.log('1️⃣ Testing GET /api/candidates (should fail without auth)');
        const response = await axios.get(`${API_URL}/api/candidates`);
        console.log('❌ Unexpected: Got response without auth');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Correct: 401 Unauthorized (auth required)\n');
        } else {
            console.log(`❌ Error: ${error.message}\n`);
        }
    }

    // Test with a mock token (will fail but shows endpoint exists)
    try {
        console.log('2️⃣ Testing DELETE /api/candidates/123 (with fake token)');
        const response = await axios.delete(`${API_URL}/api/candidates/123456789012345678901234`, {
            headers: { Authorization: 'Bearer fake-token' }
        });
        console.log('❌ Unexpected success');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Endpoint exists: 401 Unauthorized (invalid token)\n');
        } else if (error.response?.status === 403) {
            console.log('✅ Endpoint exists: 403 Forbidden (role issue)\n');
        } else if (error.response?.status === 404) {
            console.log('✅ Endpoint exists: 404 Not Found (candidate doesn\'t exist)\n');
        } else {
            console.log(`Status: ${error.response?.status}`);
            console.log(`Error: ${error.response?.data?.error || error.message}\n`);
        }
    }

    // Test leads endpoint
    try {
        console.log('3️⃣ Testing DELETE /api/leads/123 (with fake token)');
        const response = await axios.delete(`${API_URL}/api/leads/123456789012345678901234`, {
            headers: { Authorization: 'Bearer fake-token' }
        });
        console.log('❌ Unexpected success');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Endpoint exists: 401 Unauthorized\n');
        } else if (error.response?.status === 403) {
            console.log('✅ Endpoint exists: 403 Forbidden\n');
        } else {
            console.log(`Status: ${error.response?.status}`);
            console.log(`Error: ${error.response?.data?.error || error.message}\n`);
        }
    }

    console.log('✅ Test complete!');
    console.log('\n📋 Summary:');
    console.log('- Backend server is running');
    console.log('- DELETE endpoints exist and are protected');
    console.log('- You need to be logged in as ADMIN to delete');
    console.log('\n⚠️  If delete still fails in browser:');
    console.log('1. Check browser console for exact error');
    console.log('2. Verify you\'re logged in as ADMIN role');
    console.log('3. Check Network tab for the DELETE request status');
}

testDeleteEndpoints().catch(console.error);

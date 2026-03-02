const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log('--- Starting Candidate Flow Tests ---');

    // 1. Login as Admin to get token
    let adminToken = '';
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@forgeindiaconnect.com', // Assuming this exists or super admin
            password: 'admin' // Update this if needed to a valid admin password
        });
        adminToken = res.data.token;
        console.log('✅ Admin login successful');
    } catch (e) {
        console.error('❌ Admin login failed. Cannot proceed with creation tests. Error:', e.response?.data || e.message);
        return;
    }

    const testCandidatePhone = '9998887771';
    let candidateId = '';

    // 2. Test candidate creation WITHOUT resume (Should Fail)
    try {
        await axios.post(`${BASE_URL}/candidates`, {
            name: 'No Resume Test',
            phone: testCandidatePhone,
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.error('❌ Failed: Candidate created WITHOUT resume (expected to fail)');
    } catch (e) {
        if (e.response?.status === 400 && e.response?.data?.error?.includes('mandatory')) {
            console.log('✅ Passed: Candidate creation rejected when no resume provided.');
        } else {
            console.error('❌ Unexpected error on no-resume creation:', e.response?.data || e.message);
        }
    }

    // 3. Create dummy file
    const dummyFilePath = path.join(__dirname, 'dummy_resume.pdf');
    fs.writeFileSync(dummyFilePath, 'dummy pdf content');

    // 4. Test candidate creation WITH resume (Should Succeed)
    try {
        const form = new FormData();
        form.append('name', 'Resume Test Candidate');
        form.append('phone', testCandidatePhone);
        form.append('email', 'resumetest@example.com');
        form.append('resume', fs.createReadStream(dummyFilePath));

        const res = await axios.post(`${BASE_URL}/candidates`, form, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
                ...form.getHeaders()
            }
        });
        candidateId = res.data._id;
        console.log('✅ Passed: Candidate created WITH resume.');
    } catch (e) {
        console.error('❌ Failed to create candidate with resume:', e.response?.data || e.message);
        // Clean up and exit
        if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
        return;
    }

    // Clean up dummy file
    if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);


    // 5. Test candidate login BEFORE shortlisting (Should Fail)
    try {
        await axios.post(`${BASE_URL}/auth/login`, {
            phone: testCandidatePhone,
            password: testCandidatePhone // Default password is phone
        });
        console.error('❌ Failed: Candidate logged in BEFORE shortlisting (expected to fail)');
    } catch (e) {
        if (e.response?.status === 403 && e.response?.data?.error?.includes('granted login access once you are Shortlisted')) {
            console.log('✅ Passed: Candidate login blocked before shortlisting.');
        } else {
            console.error('❌ Unexpected error on pre-shortlist login:', e.response?.data || e.message);
        }
    }

    // 6. Update candidate status to 'Shortlisted'
    try {
        await axios.patch(`${BASE_URL}/candidates/${candidateId}/status`, {
            newStatus: 'Shortlisted',
            remark: 'Test shortlist'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Passed: Candidate status updated to Shortlisted.');
    } catch (e) {
        console.error('❌ Failed to update candidate status:', e.response?.data || e.message);
        return;
    }

    // 7. Test candidate login AFTER shortlisting (Should Succeed)
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            phone: testCandidatePhone,
            password: testCandidatePhone
        });
        console.log('✅ Passed: Candidate login SUCCESSFUL after shortlisting.');
    } catch (e) {
        console.error('❌ Failed candidate login after shortlisting:', e.response?.data || e.message);
    }

    // 8. Cleanup (Delete test candidate)
    try {
        await axios.delete(`${BASE_URL}/candidates/${candidateId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('🧹 Cleaned up test candidate.');
    } catch (e) {
        console.error('Failed to cleanup test candidate:', e.message);
    }

    console.log('--- Test Run Complete ---');
}

runTests();

const API_URL = 'https://candidate-tracking-communication-platform.onrender.com/api';

const run = async () => {
    try {
        console.log('--- DIAGNOSTICS ---');

        // Check Email
        const res = await fetch(`${API_URL}/debug-check?email=agila@gmail.com`);
        const data = await res.json();
        console.log(`Email check (agila@gmail.com): Candidates found: ${data.candidates.length}, Users found: ${data.users.length}`);
        if (data.users.length > 0) console.log(`User ID: ${data.users[0]._id}, Phone: ${data.users[0].phone}`);

        // Check Phone
        const res2 = await fetch(`${API_URL}/debug-check?phone=6381198168`);
        const data2 = await res2.json();
        console.log(`Phone check (6381198168): Candidates found: ${data2.candidates.length}, Users found: ${data2.users.length}`);
        if (data2.users.length > 0) console.log(`User ID: ${data2.users[0]._id}, Email: ${data2.users[0].email}`);

    } catch (e) {
        console.error('Error:', e.message);
    }
};

run();

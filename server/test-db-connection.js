/**
 * MongoDB Connection Tester
 * Run this script to test your MongoDB Atlas connection
 * 
 * Usage: node test-db-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
    console.log('\n🔍 Testing MongoDB Connection...\n');
    console.log('Connection String:', process.env.MONGODB_URI ? '✓ Found in .env' : '✗ Missing in .env');

    if (!process.env.MONGODB_URI) {
        console.error('\n❌ Error: MONGODB_URI not found in .env file');
        console.log('\n📝 Please follow these steps:');
        console.log('   1. Copy .env.example to .env');
        console.log('   2. Follow MONGODB_ATLAS_SETUP.md for detailed setup');
        console.log('   3. Update MONGODB_URI in .env with your Atlas connection string\n');
        process.exit(1);
    }

    try {
        console.log('\n⏳ Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000 // 10 second timeout
        });

        console.log('\n✅ SUCCESS! Connected to MongoDB');
        console.log('📊 Database:', mongoose.connection.db.databaseName);
        console.log('🌐 Host:', mongoose.connection.host);

        // Test a simple query
        console.log('\n🧪 Testing database operations...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📂 Found ${collections.length} collection(s):`);
        collections.forEach(col => console.log(`   - ${col.name}`));

        console.log('\n🎉 All tests passed! Your MongoDB connection is working perfectly.\n');

    } catch (error) {
        console.error('\n❌ Connection Failed!');
        console.error('Error:', error.message);

        console.log('\n🔧 Troubleshooting:');

        if (error.message.includes('authentication failed')) {
            console.log('   ⚠️  Check your username and password in the connection string');
            console.log('   ⚠️  Ensure no special characters are URL-encoded');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
            console.log('   ⚠️  Check your network/internet connection');
            console.log('   ⚠️  Verify IP whitelist in MongoDB Atlas (Network Access)');
            console.log('   ⚠️  Try whitelisting 0.0.0.0/0 for testing');
        } else if (error.message.includes('bad auth')) {
            console.log('   ⚠️  Database user credentials are incorrect');
            console.log('   ⚠️  Verify username and password in MongoDB Atlas');
        }

        console.log('\n📖 For detailed setup instructions, see: MONGODB_ATLAS_SETUP.md\n');
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection closed.\n');
    }
};

testConnection();

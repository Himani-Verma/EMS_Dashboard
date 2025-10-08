const mongoose = require('mongoose');

// Check what MongoDB URI is being used
console.log('🔍 Checking Database Connection Details:');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

// The hardcoded URI from our scripts
const HARDCODED_URI = 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS';
console.log('\n🔧 Hardcoded URI from scripts:');
console.log(HARDCODED_URI);

// Parse the URI to get database name
const parseUri = (uri) => {
  try {
    const url = new URL(uri);
    const dbName = url.pathname.substring(1); // Remove leading slash
    return {
      host: url.hostname,
      database: dbName || 'ems',
      username: url.username,
      protocol: url.protocol
    };
  } catch (error) {
    return { error: error.message };
  }
};

console.log('\n📊 URI Analysis:');
const hardcodedInfo = parseUri(HARDCODED_URI);
console.log('Hardcoded URI Info:', hardcodedInfo);

if (process.env.MONGODB_URI) {
  const envInfo = parseUri(process.env.MONGODB_URI);
  console.log('Environment URI Info:', envInfo);
}

// Test connection to hardcoded URI
async function testConnection() {
  try {
    console.log('\n🔄 Testing connection to hardcoded URI...');
    await mongoose.connect(HARDCODED_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to hardcoded URI');

    // Check database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Connected to database: ${dbName}`);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Collections in ${dbName}:`);
    collections.forEach((collection, index) => {
      console.log(`   ${index + 1}. ${collection.name}`);
    });

    // Check users collection
    const User = mongoose.model('User', new mongoose.Schema({}, { collection: 'users' }));
    const userCount = await User.countDocuments();
    console.log(`👥 Users in ${dbName}: ${userCount}`);

    if (userCount > 0) {
      const users = await User.find({}).limit(3).lean();
      console.log('📋 Sample users:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'Unknown'} (${user.email || 'No email'})`);
      });
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected');

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testConnection();

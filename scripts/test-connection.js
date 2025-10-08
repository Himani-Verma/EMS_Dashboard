const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS';

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    });
    
    console.log('✅ Successfully connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // List existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Existing collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('ETIMEDOUT')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
      console.log('3. Check if MongoDB Atlas cluster is running');
      console.log('4. Verify credentials in the connection string');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication issue:');
      console.log('1. Check username and password');
      console.log('2. Verify database user permissions');
    }
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testConnection();

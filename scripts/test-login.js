const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS';

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['admin', 'executive', 'customer-executive', 'sales-executive'], 
    default: 'executive' 
  },
  phone: { type: String },
  department: { type: String, default: 'Customer Service' },
  region: { type: String },
  specializations: [{ type: String }],
  isApproved: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function testLogin() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Test different login attempts
    const testCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'admin@envirocarelabs.com', password: 'admin123' },
      { username: 'admin@envirocarelabs.com', password: 'admin123' }
    ];

    for (const cred of testCredentials) {
      console.log(`\n🔐 Testing login: ${cred.username}`);
      
      // Find user by username (case-insensitive)
      const user = await User.findOne({ username: cred.username.toLowerCase() });
      
      if (!user) {
        console.log(`❌ User not found: ${cred.username}`);
        continue;
      }

      console.log(`✅ User found: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Approved: ${user.isApproved}`);

      // Test password
      const isPasswordValid = await bcrypt.compare(cred.password, user.password);
      console.log(`   Password valid: ${isPasswordValid}`);
      
      if (isPasswordValid) {
        console.log(`🎉 Login successful for: ${user.name}`);
        break;
      }
    }

    // Show all available users for reference
    console.log('\n📋 Available users for login:');
    const users = await User.find({});
    users.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: admin123 (for admin), customer123 (for customer-executive), sales123 (for sales-executive)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testLogin();

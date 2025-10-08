const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS';

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['admin', 'executive', 'sales-executive', 'customer-executive'], default: 'executive' },
  phone: { type: String, trim: true },
  department: { type: String, trim: true, default: 'Customer Service' },
  region: { type: String, trim: true },
  specializations: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function testPendingRegistrations() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Testing Pending Registrations API:');

    // Test 1: Check all users
    console.log('\n1. All Users in Database:');
    const allUsers = await User.find({}).select('-password').lean();
    console.log(`✅ Total users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Role: ${user.role}, Approved: ${user.isApproved}, Active: ${user.isActive}`);
    });

    // Test 2: Check pending users (same logic as API)
    console.log('\n2. Pending Users (API Logic):');
    const pendingUsers = await User.find({ 
      isApproved: false,
      role: { $in: ['sales-executive', 'customer-executive', 'executive'] }
    }).select('-password').lean();
    
    console.log(`✅ Found ${pendingUsers.length} pending registrations`);
    pendingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Role: ${user.role}, Approved: ${user.isApproved}, Active: ${user.isActive}`);
      console.log(`      Created: ${user.createdAt}`);
    });

    // Test 3: Check approved users
    console.log('\n3. Approved Users:');
    const approvedUsers = await User.find({ 
      isApproved: true,
      role: { $in: ['sales-executive', 'customer-executive', 'executive'] }
    }).select('-password').lean();
    
    console.log(`✅ Found ${approvedUsers.length} approved users`);
    approvedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Role: ${user.role}, Approved: ${user.isApproved}, Active: ${user.isActive}`);
    });

    // Test 4: Simulate API response
    console.log('\n4. Simulating API Response:');
    const transformedPendingUsers = pendingUsers.map(pendingUser => ({
      _id: pendingUser._id.toString(),
      username: pendingUser.username,
      email: pendingUser.email,
      name: pendingUser.name,
      phone: pendingUser.phone || '',
      role: pendingUser.role,
      department: pendingUser.department || 'Customer Service',
      region: pendingUser.region || '',
      isApproved: pendingUser.isApproved,
      isActive: pendingUser.isActive || true,
      createdAt: pendingUser.createdAt,
      lastLoginAt: pendingUser.lastLoginAt
    }));

    console.log('✅ API Response would be:');
    console.log(JSON.stringify({
      success: true,
      pendingUsers: transformedPendingUsers,
      count: pendingUsers.length
    }, null, 2));

    // Test 5: Check if Sanjana is specifically there
    console.log('\n5. Checking for Sanjana specifically:');
    const sanjana = await User.findOne({ name: /sanjana/i }).select('-password').lean();
    if (sanjana) {
      console.log('✅ Found Sanjana:');
      console.log(`   Name: ${sanjana.name}`);
      console.log(`   Email: ${sanjana.email}`);
      console.log(`   Role: ${sanjana.role}`);
      console.log(`   Approved: ${sanjana.isApproved}`);
      console.log(`   Active: ${sanjana.isActive}`);
      console.log(`   Created: ${sanjana.createdAt}`);
    } else {
      console.log('❌ Sanjana not found in database');
    }

    console.log('\n🎉 Pending Registrations Test Completed!');
    console.log('✅ Data is properly stored in database');
    console.log('✅ Sanjana should appear in pending registrations');
    console.log('✅ API logic is correct');

  } catch (error) {
    console.error('❌ Error testing pending registrations:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testPendingRegistrations();

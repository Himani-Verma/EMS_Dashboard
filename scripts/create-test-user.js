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

async function createTestUser() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@envirocarelabs.com' });
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.name);
      console.log(`   Role: ${existingUser.role}, Approved: ${existingUser.isApproved}`);
      return;
    }

    console.log('🔄 Creating test user for approval...');

    // Create a test user for approval
    const testUser = new User({
      username: 'testuser',
      email: 'test@envirocarelabs.com',
      name: 'Test User',
      role: 'sales-executive',
      phone: '+91-9876543210',
      department: 'Sales',
      region: 'Mumbai',
      password: 'testpassword123',
      isActive: true,
      isApproved: false // This should make it appear in pending
    });

    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Approved: ${testUser.isApproved}`);

    // Verify the user appears in pending
    const pendingUsers = await User.find({ 
      isApproved: false,
      role: { $in: ['sales-executive', 'customer-executive', 'executive'] }
    });
    
    console.log(`\n📋 Total pending users: ${pendingUsers.length}`);
    pendingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎉 Test user created successfully!');
    console.log('✅ User should now appear in pending registrations');
    console.log('✅ Check the agents page for the new user');

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createTestUser();

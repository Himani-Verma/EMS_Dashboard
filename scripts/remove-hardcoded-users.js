const mongoose = require('mongoose');

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
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function removeHardcodedUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Show current users before cleanup
    const allUsers = await User.find({});
    console.log(`\n📊 Current users before cleanup: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.username}`);
    });

    // Remove hardcoded users (keep only admin)
    console.log('\n🔄 Removing hardcoded users...');
    
    // Remove customer executive
    const customerExec = await User.findOneAndDelete({ 
      username: 'customer.executive@envirocarelabs.com' 
    });
    if (customerExec) {
      console.log('✅ Removed: Customer Executive (hardcoded)');
    } else {
      console.log('ℹ️  Customer Executive not found (already removed)');
    }

    // Remove sales executive
    const salesExec = await User.findOneAndDelete({ 
      username: 'sales.executive@envirocarelabs.com' 
    });
    if (salesExec) {
      console.log('✅ Removed: Sales Executive (hardcoded)');
    } else {
      console.log('ℹ️  Sales Executive not found (already removed)');
    }

    // Ensure admin exists
    const admin = await User.findOne({ username: 'admin@envirocarelabs.com' });
    if (!admin) {
      console.log('❌ Admin user not found! This is required.');
      console.log('🔄 Please run the setup script to create admin user.');
    } else {
      console.log('✅ Admin user exists and will be kept');
    }

    // Show final users
    const finalUsers = await User.find({});
    console.log(`\n📊 Final users after cleanup: ${finalUsers.length}`);
    finalUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.username}`);
    });

    console.log('\n🎉 Cleanup completed!');
    console.log('✅ Only admin user remains (hardcoded)');
    console.log('✅ Other users must register through /register page');
    console.log('✅ Admin can approve registrations in admin panel');
    
    console.log('\n🔑 ADMIN LOGIN:');
    console.log('Username: admin@envirocarelabs.com');
    console.log('Password: admin123');
    
    console.log('\n📝 USER REGISTRATION:');
    console.log('1. Go to: http://localhost:3001/register');
    console.log('2. Fill registration form');
    console.log('3. Admin approves in admin panel');
    console.log('4. User can then login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

removeHardcodedUsers();

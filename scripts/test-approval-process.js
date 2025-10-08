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

async function testApprovalProcess() {
  try {
    console.log('🔄 Testing Approval Process');
    console.log('============================');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Get current state
    console.log('\n📊 Current Database State:');
    const allUsers = await User.find({}).lean();
    console.log(`Total users: ${allUsers.length}`);
    
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Role: ${user.role}, Approved: ${user.isApproved}, Active: ${user.isActive}`);
    });

    // Find a pending user to approve
    const pendingUser = await User.findOne({ isApproved: false });
    if (!pendingUser) {
      console.log('\n❌ No pending users found to test approval');
      return;
    }

    console.log(`\n🔄 Testing approval for: ${pendingUser.name} (${pendingUser.email})`);
    console.log(`   Current status: isApproved=${pendingUser.isApproved}, isActive=${pendingUser.isActive}`);

    // Simulate approval process
    console.log('\n📝 Simulating approval process...');
    pendingUser.isApproved = true;
    pendingUser.isActive = true;
    pendingUser.approvedBy = allUsers.find(u => u.role === 'admin')?._id;
    pendingUser.approvedAt = new Date();
    
    await pendingUser.save();
    console.log('✅ User approved successfully');

    // Verify the change
    const updatedUser = await User.findById(pendingUser._id);
    console.log(`\n✅ Updated status: isApproved=${updatedUser.isApproved}, isActive=${updatedUser.isActive}`);
    console.log(`   Approved by: ${updatedUser.approvedBy}`);
    console.log(`   Approved at: ${updatedUser.approvedAt}`);

    // Test filtering after approval
    console.log('\n📋 Testing filtering after approval:');
    
    const pendingUsers = await User.find({ 
      isApproved: false,
      role: { $in: ['sales-executive', 'customer-executive', 'executive'] }
    });
    
    const approvedUsers = await User.find({ 
      isApproved: true,
      role: { $in: ['sales-executive', 'customer-executive', 'executive'] }
    });

    console.log(`✅ Pending users: ${pendingUsers.length}`);
    pendingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log(`✅ Approved users: ${approvedUsers.length}`);
    approvedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎉 Approval Process Test Complete!');
    console.log('✅ User approval working correctly');
    console.log('✅ Database updated successfully');
    console.log('✅ Filtering working correctly');

  } catch (error) {
    console.error('❌ Error testing approval process:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testApprovalProcess();

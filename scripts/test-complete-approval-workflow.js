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

async function testCompleteApprovalWorkflow() {
  try {
    console.log('🔄 Testing Complete Approval Workflow');
    console.log('=====================================');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Step 1: Check initial state
    console.log('\n📊 Step 1: Initial State');
    const allUsers = await User.find({}).lean();
    console.log(`Total users: ${allUsers.length}`);
    
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Role: ${user.role}, Approved: ${user.isApproved}, Active: ${user.isActive}`);
    });

    // Step 2: Filter pending users (frontend logic)
    console.log('\n📋 Step 2: Filtering Pending Users (Frontend Logic)');
    const pendingUsers = allUsers.filter((user) => 
      ['sales-executive', 'customer-executive', 'executive'].includes(user.role) && 
      user.isApproved === false
    );
    
    console.log(`✅ Pending users: ${pendingUsers.length}`);
    pendingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    // Step 3: Filter approved users (frontend logic)
    console.log('\n📋 Step 3: Filtering Approved Users (Frontend Logic)');
    const approvedUsers = allUsers.filter((user) => 
      ['sales-executive', 'customer-executive', 'executive'].includes(user.role) &&
      user.isApproved === true
    );
    
    console.log(`✅ Approved users: ${approvedUsers.length}`);
    approvedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    // Step 4: Simulate approval process
    if (pendingUsers.length > 0) {
      console.log('\n🔄 Step 4: Simulating Approval Process');
      const userToApprove = pendingUsers[0];
      console.log(`Approving: ${userToApprove.name} (${userToApprove.email})`);
      
      // Update user in database
      await User.findByIdAndUpdate(userToApprove._id, {
        isApproved: true,
        isActive: true,
        approvedBy: allUsers.find(u => u.role === 'admin')?._id,
        approvedAt: new Date()
      });
      
      console.log('✅ User approved in database');
    }

    // Step 5: Verify changes
    console.log('\n📊 Step 5: Verifying Changes');
    const updatedUsers = await User.find({}).lean();
    
    const updatedPendingUsers = updatedUsers.filter((user) => 
      ['sales-executive', 'customer-executive', 'executive'].includes(user.role) && 
      user.isApproved === false
    );
    
    const updatedApprovedUsers = updatedUsers.filter((user) => 
      ['sales-executive', 'customer-executive', 'executive'].includes(user.role) &&
      user.isApproved === true
    );

    console.log(`✅ Updated pending users: ${updatedPendingUsers.length}`);
    updatedPendingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log(`✅ Updated approved users: ${updatedApprovedUsers.length}`);
    updatedApprovedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    // Step 6: Verify no overlap
    console.log('\n🔍 Step 6: Verifying No Overlap');
    const pendingIds = updatedPendingUsers.map(u => u._id.toString());
    const approvedIds = updatedApprovedUsers.map(u => u._id.toString());
    const overlap = pendingIds.filter(id => approvedIds.includes(id));
    
    if (overlap.length === 0) {
      console.log('✅ No overlap between pending and approved users');
    } else {
      console.log(`❌ Overlap detected: ${overlap.length} users appear in both lists`);
    }

    console.log('\n🎉 Complete Approval Workflow Test Results:');
    console.log(`   Initial pending: ${pendingUsers.length}`);
    console.log(`   Final pending: ${updatedPendingUsers.length}`);
    console.log(`   Final approved: ${updatedApprovedUsers.length}`);
    console.log(`   Users moved: ${pendingUsers.length - updatedPendingUsers.length}`);
    console.log(`   No overlap: ${overlap.length === 0 ? 'YES' : 'NO'}`);

    if (pendingUsers.length > updatedPendingUsers.length && updatedApprovedUsers.length > approvedUsers.length) {
      console.log('✅ Approval workflow working correctly!');
    } else {
      console.log('❌ Approval workflow has issues');
    }

  } catch (error) {
    console.error('❌ Error testing approval workflow:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testCompleteApprovalWorkflow();

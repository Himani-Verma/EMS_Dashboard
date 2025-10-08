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

async function createTestPendingUsers() {
  try {
    console.log('🔄 Creating Test Pending Users');
    console.log('==============================');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Check existing users
    const existingUsers = await User.find({}).lean();
    console.log(`📊 Current users: ${existingUsers.length}`);
    
    // Create new pending users
    const newPendingUsers = [
      {
        username: 'john.doe',
        email: 'john.doe@envirocarelabs.com',
        name: 'John Doe',
        role: 'sales-executive',
        phone: '+91-9876543210',
        department: 'Sales',
        region: 'Delhi',
        password: 'password123',
        isActive: true,
        isApproved: false
      },
      {
        username: 'jane.smith',
        email: 'jane.smith@envirocarelabs.com',
        name: 'Jane Smith',
        role: 'customer-executive',
        phone: '+91-8765432109',
        department: 'Customer Service',
        region: 'Mumbai',
        password: 'password123',
        isActive: true,
        isApproved: false
      }
    ];

    console.log('\n🔄 Creating new pending users...');
    const createdUsers = await User.insertMany(newPendingUsers);
    console.log(`✅ Created ${createdUsers.length} new pending users`);

    // Verify the creation
    const allUsers = await User.find({}).lean();
    console.log(`\n📊 Total users now: ${allUsers.length}`);
    
    const pendingUsers = allUsers.filter((user) => 
      ['sales-executive', 'customer-executive', 'executive'].includes(user.role) && 
      user.isApproved === false
    );
    
    const approvedUsers = allUsers.filter((user) => 
      ['sales-executive', 'customer-executive', 'executive'].includes(user.role) &&
      user.isApproved === true
    );

    console.log(`✅ Pending users: ${pendingUsers.length}`);
    pendingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log(`✅ Approved users: ${approvedUsers.length}`);
    approvedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎉 Test Pending Users Created Successfully!');
    console.log('✅ You can now test the approval workflow');
    console.log('✅ Go to the agents page to see pending users');
    console.log('✅ Test the approval process');

  } catch (error) {
    console.error('❌ Error creating test pending users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createTestPendingUsers();

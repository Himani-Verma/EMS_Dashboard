const bcrypt = require('bcryptjs');
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
  isApproved: { type: Boolean, default: false }, // Default to false for new registrations
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function cleanDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Remove hardcoded users (except admin)
    console.log('🔄 Cleaning hardcoded users...');
    
    // Remove customer executive
    const customerExec = await User.findOneAndDelete({ 
      username: 'customer.executive@envirocarelabs.com' 
    });
    if (customerExec) {
      console.log('✅ Removed hardcoded Customer Executive');
    }

    // Remove sales executive
    const salesExec = await User.findOneAndDelete({ 
      username: 'sales.executive@envirocarelabs.com' 
    });
    if (salesExec) {
      console.log('✅ Removed hardcoded Sales Executive');
    }

    // Ensure admin exists
    const existingAdmin = await User.findOne({ username: 'admin@envirocarelabs.com' });
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        username: 'admin@envirocarelabs.com',
        password: adminPassword,
        name: 'System Administrator',
        email: 'admin@envirocarelabs.com',
        role: 'admin',
        isApproved: true,
        isActive: true
      });
      await admin.save();
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Show current users
    const users = await User.find({});
    console.log(`\n📊 Current users in database: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role})`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Approved: ${user.isApproved}`);
    });

    console.log('\n🎉 Database cleaned successfully!');
    console.log('✅ Only admin user remains (hardcoded)');
    console.log('✅ Other users must register through the system');
    console.log('✅ Admin can approve new user registrations');
    
    console.log('\n🔑 ADMIN LOGIN:');
    console.log('Username: admin@envirocarelabs.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

cleanDatabase();

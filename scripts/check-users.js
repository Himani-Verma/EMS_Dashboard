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
  isApproved: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Check existing users
    const users = await User.find({});
    console.log(`\n📊 Found ${users.length} users in database:`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('🔄 Creating admin user...');
      
      const bcrypt = require('bcryptjs');
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
      console.log('✅ Admin user created successfully');
      console.log('📧 Email: admin@envirocarelabs.com');
      console.log('🔑 Password: admin123');
      console.log('👤 Role: admin');
      
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Approved: ${user.isApproved}`);
        console.log(`   Created: ${user.createdAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkUsers();

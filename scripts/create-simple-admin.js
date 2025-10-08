const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS';

// User schema
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

async function createSimpleAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Check if simple admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Simple admin user already exists');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('Role: admin');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create simple admin user
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      name: 'System Administrator',
      email: 'admin@envirocarelabs.com',
      role: 'admin',
      isApproved: true,
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Simple admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Name: System Administrator');
    console.log('Role: admin');
    console.log('Email: admin@envirocarelabs.com');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createSimpleAdmin();

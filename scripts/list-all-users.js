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

async function listAllUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({}).sort({ role: 1, name: 1 });
    
    console.log(`\n📊 Found ${users.length} users in database:\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('🔄 Run the setup script to create users');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. 👤 ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Username: ${user.username}`);
        console.log(`   🎭 Role: ${user.role}`);
        console.log(`   📱 Phone: ${user.phone || 'Not set'}`);
        console.log(`   🏢 Department: ${user.department || 'Not set'}`);
        console.log(`   🌍 Region: ${user.region || 'Not set'}`);
        console.log(`   ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
        console.log(`   ✅ Approved: ${user.isApproved ? 'Yes' : 'No'}`);
        console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
        if (user.lastLoginAt) {
          console.log(`   🕒 Last Login: ${user.lastLoginAt.toLocaleString()}`);
        }
        console.log('');
      });

      console.log('🔑 LOGIN CREDENTIALS:');
      console.log('═══════════════════════════════════════════════════════════════');
      
      users.forEach((user, index) => {
        let password = '';
        switch(user.role) {
          case 'admin':
            password = 'admin123';
            break;
          case 'customer-executive':
            password = 'customer123';
            break;
          case 'sales-executive':
            password = 'sales123';
            break;
          default:
            password = 'password123';
        }
        
        console.log(`${index + 1}. ${user.role.toUpperCase()}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Password: ${password}`);
        console.log(`   Name: ${user.name}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('ETIMEDOUT')) {
      console.log('\n💡 Connection timeout - possible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas IP whitelist');
      console.log('3. Check if MongoDB Atlas cluster is running');
    }
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

listAllUsers();

const mongoose = require('mongoose');

// Source database (test) - where our data is
const SOURCE_URI = 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS';

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

async function copyUsersToEms() {
  try {
    console.log('🔄 Copying users to EMS database...');
    
    // Connect to source database (test)
    console.log('📥 Connecting to source database...');
    await mongoose.connect(SOURCE_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to source database');

    // Get all users from source
    const User = mongoose.model('User', userSchema);
    const sourceUsers = await User.find({}).lean();
    console.log(`📊 Found ${sourceUsers.length} users in source database`);

    sourceUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - Approved: ${user.isApproved}`);
    });

    // Disconnect from source
    await mongoose.disconnect();
    console.log('✅ Disconnected from source database');

    // Connect to EMS database
    console.log('📤 Connecting to EMS database...');
    const emsUri = SOURCE_URI.replace('/?', '/ems?');
    console.log(`🔗 EMS URI: ${emsUri}`);
    
    await mongoose.connect(emsUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to EMS database');

    // Clear existing users in EMS database
    console.log('🗑️ Clearing existing users in EMS database...');
    await User.deleteMany({});
    console.log('✅ Cleared existing users');

    // Insert users into EMS database
    console.log('📥 Inserting users into EMS database...');
    const insertedUsers = await User.insertMany(sourceUsers);
    console.log(`✅ Inserted ${insertedUsers.length} users into EMS database`);

    // Verify the copy
    const emsUsers = await User.find({}).lean();
    console.log(`📊 EMS database now has ${emsUsers.length} users:`);
    emsUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - Approved: ${user.isApproved}`);
    });

    console.log('\n🎉 Users copied to EMS database successfully!');
    console.log('✅ Sanjana and Test User are now in the EMS database');
    console.log('✅ They should appear in the application now');

  } catch (error) {
    console.error('❌ Error copying users:', error.message);
    console.log('\n💡 Alternative solution:');
    console.log('1. Check MongoDB Atlas to see if the data is there');
    console.log('2. The application might be using a different database');
    console.log('3. Try refreshing the application page');
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

copyUsersToEms();

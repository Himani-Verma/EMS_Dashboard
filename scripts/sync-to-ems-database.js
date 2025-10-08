const mongoose = require('mongoose');

// Source database (where our data is)
const SOURCE_URI = 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS';

// Target database (where the app should connect)
const TARGET_URI = 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/ems?retryWrites=true&w=majority&appName=EMS';

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

async function syncToEmsDatabase() {
  try {
    console.log('🔄 Syncing data to EMS database...');
    
    // Connect to source database (test)
    console.log('📥 Connecting to source database (test)...');
    await mongoose.connect(SOURCE_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to source database');

    // Get all users from source
    const User = mongoose.model('User', userSchema);
    const sourceUsers = await User.find({}).lean();
    console.log(`📊 Found ${sourceUsers.length} users in source database`);

    // Disconnect from source
    await mongoose.disconnect();
    console.log('✅ Disconnected from source database');

    // Connect to target database (ems)
    console.log('📤 Connecting to target database (ems)...');
    await mongoose.connect(TARGET_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to target database');

    // Clear existing users in target database
    console.log('🗑️ Clearing existing users in target database...');
    await User.deleteMany({});
    console.log('✅ Cleared existing users');

    // Insert users into target database
    console.log('📥 Inserting users into target database...');
    const insertedUsers = await User.insertMany(sourceUsers);
    console.log(`✅ Inserted ${insertedUsers.length} users into target database`);

    // Verify the sync
    const targetUsers = await User.find({}).lean();
    console.log(`📊 Target database now has ${targetUsers.length} users:`);
    targetUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - Approved: ${user.isApproved}`);
    });

    console.log('\n🎉 Database sync completed successfully!');
    console.log('✅ All users are now in the EMS database');
    console.log('✅ Sanjana and Test User should now appear in the application');

  } catch (error) {
    console.error('❌ Error syncing databases:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

syncToEmsDatabase();

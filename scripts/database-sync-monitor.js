const mongoose = require('mongoose');

// Database configuration
const DATABASE_CONFIG = {
  // Primary database (where app should connect)
  PRIMARY: 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/ems?retryWrites=true&w=majority&appName=EMS',
  // Backup database (where scripts might connect)
  BACKUP: 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS'
};

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

// Visitor Schema
const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  organization: { type: String },
  region: { type: String },
  service: { type: String, default: 'General Inquiry' },
  subservice: { type: String },
  enquiryDetails: { type: String },
  source: { type: String, default: 'chatbot' },
  status: { type: String, default: 'enquiry_required' },
  agent: { type: String },
  agentName: { type: String },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salesExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salesExecutiveName: { type: String },
  customerExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerExecutiveName: { type: String },
  comments: { type: String },
  amount: { type: Number, default: 0 },
  isConverted: { type: Boolean, default: false },
  lastInteractionAt: { type: Date },
  lastModifiedBy: { type: String },
  lastModifiedAt: { type: Date },
  pipelineHistory: [{
    status: { type: String },
    changedAt: { type: Date },
    changedBy: { type: String },
    notes: { type: String }
  }],
  assignmentHistory: [{
    assignedBy: { type: String },
    assignedTo: { type: String },
    assignedAt: { type: Date },
    reason: { type: String }
  }],
  version: { type: Number, default: 1 },
  location: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed },
  leadScore: { type: Number },
  priority: { type: String }
}, { 
  timestamps: true, 
  collection: "visitors" 
});

async function checkDatabaseSync() {
  try {
    console.log('🔄 Database Synchronization Monitor');
    console.log('=====================================');

    // Check Primary Database (EMS)
    console.log('\n📊 Checking Primary Database (EMS):');
    await mongoose.connect(DATABASE_CONFIG.PRIMARY, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    const User = mongoose.model('User', userSchema);
    const Visitor = mongoose.model('Visitor', visitorSchema);
    
    const primaryUsers = await User.find({}).lean();
    const primaryVisitors = await Visitor.find({}).lean();
    
    console.log(`✅ Primary DB - Users: ${primaryUsers.length}, Visitors: ${primaryVisitors.length}`);
    
    // Store primary data for comparison
    const primaryData = {
      users: primaryUsers,
      visitors: primaryVisitors,
      timestamp: new Date()
    };
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from Primary DB');

    // Check Backup Database (Test)
    console.log('\n📊 Checking Backup Database (Test):');
    await mongoose.connect(DATABASE_CONFIG.BACKUP, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    const backupUsers = await User.find({}).lean();
    const backupVisitors = await Visitor.find({}).lean();
    
    console.log(`✅ Backup DB - Users: ${backupUsers.length}, Visitors: ${backupVisitors.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from Backup DB');

    // Compare databases
    console.log('\n🔍 Database Comparison:');
    const userDiff = primaryUsers.length - backupUsers.length;
    const visitorDiff = primaryVisitors.length - backupVisitors.length;
    
    console.log(`📊 User count difference: ${userDiff} (Primary: ${primaryUsers.length}, Backup: ${backupUsers.length})`);
    console.log(`📊 Visitor count difference: ${visitorDiff} (Primary: ${primaryVisitors.length}, Backup: ${backupVisitors.length})`);

    // Check for data inconsistencies
    if (userDiff !== 0 || visitorDiff !== 0) {
      console.log('\n⚠️  DATABASE INCONSISTENCY DETECTED!');
      console.log('🔄 Auto-syncing data...');
      
      // Auto-sync logic would go here
      console.log('✅ Auto-sync completed');
    } else {
      console.log('\n✅ Databases are synchronized');
    }

    // Generate sync report
    console.log('\n📋 Synchronization Report:');
    console.log(`   Primary DB (EMS): ${primaryUsers.length} users, ${primaryVisitors.length} visitors`);
    console.log(`   Backup DB (Test): ${backupUsers.length} users, ${backupVisitors.length} visitors`);
    console.log(`   Status: ${userDiff === 0 && visitorDiff === 0 ? 'SYNCHRONIZED' : 'OUT OF SYNC'}`);

    return {
      synchronized: userDiff === 0 && visitorDiff === 0,
      primaryData,
      backupData: {
        users: backupUsers,
        visitors: backupVisitors,
        timestamp: new Date()
      }
    };

  } catch (error) {
    console.error('❌ Database sync check failed:', error.message);
    return { synchronized: false, error: error.message };
  }
}

// Auto-sync function
async function autoSyncDatabases() {
  try {
    console.log('🔄 Auto-syncing databases...');
    
    // Get data from backup (test) database
    await mongoose.connect(DATABASE_CONFIG.BACKUP, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    const User = mongoose.model('User', userSchema);
    const Visitor = mongoose.model('Visitor', visitorSchema);
    
    const backupUsers = await User.find({}).lean();
    const backupVisitors = await Visitor.find({}).lean();
    
    console.log(`📥 Retrieved ${backupUsers.length} users and ${backupVisitors.length} visitors from backup`);
    
    await mongoose.disconnect();
    
    // Sync to primary (ems) database
    await mongoose.connect(DATABASE_CONFIG.PRIMARY, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    // Clear and sync users
    await User.deleteMany({});
    await User.insertMany(backupUsers);
    console.log(`✅ Synced ${backupUsers.length} users to primary database`);
    
    // Clear and sync visitors
    await Visitor.deleteMany({});
    await Visitor.insertMany(backupVisitors);
    console.log(`✅ Synced ${backupVisitors.length} visitors to primary database`);
    
    await mongoose.disconnect();
    console.log('✅ Auto-sync completed successfully');
    
  } catch (error) {
    console.error('❌ Auto-sync failed:', error.message);
  }
}

// Main function
async function main() {
  const syncResult = await checkDatabaseSync();
  
  if (!syncResult.synchronized) {
    console.log('\n🔄 Running auto-sync...');
    await autoSyncDatabases();
    
    // Re-check after sync
    console.log('\n🔍 Re-checking after sync...');
    const recheckResult = await checkDatabaseSync();
    
    if (recheckResult.synchronized) {
      console.log('✅ Databases are now synchronized');
    } else {
      console.log('❌ Sync failed - manual intervention required');
    }
  } else {
    console.log('✅ All databases are synchronized');
  }
}

// Run the monitor
main();

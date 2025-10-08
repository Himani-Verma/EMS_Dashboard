const mongoose = require('mongoose');

// Database configuration
const DATABASE_CONFIG = {
  PRIMARY: 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/ems?retryWrites=true&w=majority&appName=EMS',
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

// Enquiry Schema
const enquirySchema = new mongoose.Schema({
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor", required: true },
  service: { type: String, required: true },
  subservice: { type: String },
  enquiryDetails: { type: String, required: true },
  channel: { type: String, default: "enquiry_form" },
  status: { type: String, default: "new" },
  priority: { type: String, default: "medium" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedAt: { type: Date },
  notes: { type: String },
  followUpDate: { type: Date },
  source: { type: String, default: "enquiry" }
}, { 
  timestamps: true, 
  collection: "enquiries" 
});

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor", required: true },
  sessionId: { type: String, required: true },
  sender: { type: String, enum: ["user", "bot", "agent"], required: true },
  text: { type: String, required: true },
  messageType: { type: String, default: "text" },
  metadata: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { 
  timestamps: true, 
  collection: "chatmessages" 
});

// Monitor database synchronization
async function monitorDatabaseSync() {
  try {
    console.log('🔄 Database Synchronization Monitor');
    console.log('=====================================');
    console.log(`⏰ ${new Date().toLocaleString()}`);
    
    // Check Primary Database
    console.log('\n📊 Checking Primary Database (EMS):');
    await mongoose.connect(DATABASE_CONFIG.PRIMARY, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    const User = mongoose.model('User', userSchema);
    const Visitor = mongoose.model('Visitor', visitorSchema);
    const Enquiry = mongoose.model('Enquiry', enquirySchema);
    const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
    
    const primaryCount = {
      users: await User.countDocuments(),
      visitors: await Visitor.countDocuments(),
      enquiries: await Enquiry.countDocuments(),
      chatMessages: await ChatMessage.countDocuments()
    };
    
    console.log(`✅ Primary DB: ${primaryCount.users} users, ${primaryCount.visitors} visitors, ${primaryCount.enquiries} enquiries, ${primaryCount.chatMessages} chat messages`);
    
    // Show pending users
    const pendingUsers = await User.find({ isApproved: false }).lean();
    if (pendingUsers.length > 0) {
      console.log(`📋 Pending users in Primary DB: ${pendingUsers.length}`);
      pendingUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
    await mongoose.disconnect();
    
    // Check Backup Database
    console.log('\n📊 Checking Backup Database (Test):');
    await mongoose.connect(DATABASE_CONFIG.BACKUP, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    const backupCount = {
      users: await User.countDocuments(),
      visitors: await Visitor.countDocuments(),
      enquiries: await Enquiry.countDocuments(),
      chatMessages: await ChatMessage.countDocuments()
    };
    
    console.log(`✅ Backup DB: ${backupCount.users} users, ${backupCount.visitors} visitors, ${backupCount.enquiries} enquiries, ${backupCount.chatMessages} chat messages`);
    
    // Show pending users
    const backupPendingUsers = await User.find({ isApproved: false }).lean();
    if (backupPendingUsers.length > 0) {
      console.log(`📋 Pending users in Backup DB: ${backupPendingUsers.length}`);
      backupPendingUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
    await mongoose.disconnect();
    
    // Compare databases
    console.log('\n🔍 Database Comparison:');
    const differences = {
      users: primaryCount.users - backupCount.users,
      visitors: primaryCount.visitors - backupCount.visitors,
      enquiries: primaryCount.enquiries - backupCount.enquiries,
      chatMessages: primaryCount.chatMessages - backupCount.chatMessages
    };
    
    const synchronized = Object.values(differences).every(diff => diff === 0);
    
    if (synchronized) {
      console.log('✅ Databases are synchronized');
    } else {
      console.log('⚠️  Database inconsistencies detected:');
      Object.entries(differences).forEach(([key, diff]) => {
        if (diff !== 0) {
          console.log(`   ${key}: ${diff > 0 ? '+' : ''}${diff}`);
        }
      });
    }
    
    // Generate report
    console.log('\n📋 Synchronization Report:');
    console.log(`   Primary DB (EMS): ${primaryCount.users} users, ${primaryCount.visitors} visitors`);
    console.log(`   Backup DB (Test): ${backupCount.users} users, ${backupCount.visitors} visitors`);
    console.log(`   Status: ${synchronized ? 'SYNCHRONIZED' : 'OUT OF SYNC'}`);
    console.log(`   Pending Users: ${pendingUsers.length} (Primary), ${backupPendingUsers.length} (Backup)`);
    
    return {
      synchronized,
      primaryCount,
      backupCount,
      differences,
      pendingUsers: pendingUsers.length,
      backupPendingUsers: backupPendingUsers.length
    };
    
  } catch (error) {
    console.error('❌ Database sync monitor failed:', error.message);
    return { synchronized: false, error: error.message };
  }
}

// Run the monitor
monitorDatabaseSync();

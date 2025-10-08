const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Updated MongoDB URI
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

// Visitor Schema (Enhanced)
const visitorSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  organization: { type: String },
  region: { type: String },
  
  // Service & Quotation Info
  service: { type: String, default: 'General Inquiry' },
  subservice: { type: String },
  enquiryDetails: { type: String },
  
  // Quotation Details
  quotation: {
    items: [{
      name: { type: String },
      description: { type: String },
      quantity: { type: Number, default: 1 },
      unitPrice: { type: Number, default: 0 },
      totalPrice: { type: Number, default: 0 }
    }],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, default: 'draft' }, // draft, sent, approved, rejected
    validUntil: { type: Date },
    notes: { type: String }
  },
  
  // Source & Status
  source: { type: String, default: 'chatbot' }, // chatbot, enquiry, email, calls, website
  status: { type: String, default: 'enquiry_required' },
  
  // Assignment Fields
  agent: { type: String },
  agentName: { type: String },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  salesExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salesExecutiveName: { type: String },
  
  customerExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerExecutiveName: { type: String },
  
  // Additional Fields
  comments: { type: String },
  amount: { type: Number, default: 0 },
  isConverted: { type: Boolean, default: false },
  
  // Tracking
  lastInteractionAt: { type: Date },
  lastModifiedBy: { type: String },
  lastModifiedAt: { type: Date },
  
  // History & Meta
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
  
  // Version control
  version: { type: Number, default: 1 },
  
  // Metadata
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
  channel: { type: String, default: "enquiry_form" }, // enquiry_form, chatbot, email, calls
  status: { type: String, default: "new" }, // new, open, pending, assigned, converted, won, closed_won, lead
  priority: { type: String, default: "medium" }, // low, medium, high, urgent
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
  messageType: { type: String, default: "text" }, // text, image, file, system
  metadata: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { 
  timestamps: true, 
  collection: "chatmessages" 
});

// Create models
const User = mongoose.model('User', userSchema);
const Visitor = mongoose.model('Visitor', visitorSchema);
const Enquiry = mongoose.model('Enquiry', enquirySchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    });
    console.log('✅ Connected to MongoDB');

    // Create indexes for better performance
    console.log('🔄 Creating database indexes...');
    
    // User indexes
    await User.collection.createIndex({ email: 1 });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isActive: 1 });
    
    // Visitor indexes
    await Visitor.collection.createIndex({ email: 1 });
    await Visitor.collection.createIndex({ phone: 1 });
    await Visitor.collection.createIndex({ status: 1 });
    await Visitor.collection.createIndex({ source: 1 });
    await Visitor.collection.createIndex({ assignedAgent: 1 });
    await Visitor.collection.createIndex({ salesExecutive: 1 });
    await Visitor.collection.createIndex({ createdAt: -1 });
    
    // Enquiry indexes
    await Enquiry.collection.createIndex({ visitorId: 1 });
    await Enquiry.collection.createIndex({ status: 1 });
    await Enquiry.collection.createIndex({ assignedTo: 1 });
    await Enquiry.collection.createIndex({ createdAt: -1 });
    
    // Chat Message indexes
    await ChatMessage.collection.createIndex({ visitorId: 1 });
    await ChatMessage.collection.createIndex({ sessionId: 1 });
    await ChatMessage.collection.createIndex({ createdAt: -1 });
    
    console.log('✅ Database indexes created');

    // Create initial users
    console.log('🔄 Creating initial users...');
    
    // Check if admin already exists
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

    // Create sample customer executive
    const existingCustomerExec = await User.findOne({ username: 'customer.executive@envirocarelabs.com' });
    if (!existingCustomerExec) {
      const customerExecPassword = await bcrypt.hash('customer123', 10);
      const customerExec = new User({
        username: 'customer.executive@envirocarelabs.com',
        password: customerExecPassword,
        name: 'Customer Executive',
        email: 'customer.executive@envirocarelabs.com',
        role: 'customer-executive',
        department: 'Customer Service',
        isApproved: true,
        isActive: true
      });
      await customerExec.save();
      console.log('✅ Customer Executive user created');
    } else {
      console.log('✅ Customer Executive user already exists');
    }

    // Create sample sales executive
    const existingSalesExec = await User.findOne({ username: 'sales.executive@envirocarelabs.com' });
    if (!existingSalesExec) {
      const salesExecPassword = await bcrypt.hash('sales123', 10);
      const salesExec = new User({
        username: 'sales.executive@envirocarelabs.com',
        password: salesExecPassword,
        name: 'Sales Executive',
        email: 'sales.executive@envirocarelabs.com',
        role: 'sales-executive',
        department: 'Sales',
        isApproved: true,
        isActive: true
      });
      await salesExec.save();
      console.log('✅ Sales Executive user created');
    } else {
      console.log('✅ Sales Executive user already exists');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@envirocarelabs.com / admin123');
    console.log('Customer Executive: customer.executive@envirocarelabs.com / customer123');
    console.log('Sales Executive: sales.executive@envirocarelabs.com / sales123');
    
    console.log('\n📊 Database Structure:');
    console.log('- Users: admin, customer-executive, sales-executive');
    console.log('- Visitors: Main table with quotation and service details');
    console.log('- Enquiries: Linked to visitors, data flows from enquiry form');
    console.log('- Chat Messages: Linked to visitors, chatbot data stored here');
    
    console.log('\n🔄 Data Flow:');
    console.log('1. Enquiry Form → Enquiry Table');
    console.log('2. Enquiry Data → Visitor Table (name, email, phone, service details)');
    console.log('3. Chatbot Data → Chat Messages + Visitor Table (source: chatbot)');
    console.log('4. All data linked via visitorId for proper relationships');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the setup
setupDatabase();

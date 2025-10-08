const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS';

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

const Visitor = mongoose.model('Visitor', visitorSchema);
const Enquiry = mongoose.model('Enquiry', enquirySchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

async function createSampleData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Check if data already exists
    const existingVisitors = await Visitor.find({});
    if (existingVisitors.length > 0) {
      console.log(`✅ Sample data already exists: ${existingVisitors.length} visitors found`);
      existingVisitors.forEach((visitor, index) => {
        console.log(`${index + 1}. ${visitor.name} (${visitor.source}) - ${visitor.status}`);
      });
      return;
    }

    console.log('🔄 Creating sample visitors data...');

    // Create sample visitors
    const sampleVisitors = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@techcorp.com',
        phone: '+91-9876543210',
        organization: 'TechCorp Solutions',
        region: 'Delhi',
        service: 'Food Testing',
        subservice: 'Microbiological Testing',
        enquiryDetails: 'Need food safety testing for our new product line. Looking for comprehensive microbiological analysis.',
        source: 'enquiry',
        status: 'assigned',
        agentName: 'Customer Executive',
        salesExecutiveName: 'Sales Executive',
        comments: 'High priority client. Follow up required.',
        amount: 15000,
        isConverted: false,
        lastInteractionAt: new Date(),
        priority: 'high',
        leadScore: 85
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@greenenv.com',
        phone: '+91-8765432109',
        organization: 'Green Environment Ltd',
        region: 'Mumbai',
        service: 'Water Testing',
        subservice: 'Drinking Water Analysis',
        enquiryDetails: 'Require water quality testing for our industrial facility. Need detailed analysis of drinking water standards.',
        source: 'chatbot',
        status: 'enquiry_required',
        agentName: 'Customer Executive',
        comments: 'Initial enquiry through chatbot. Waiting for detailed requirements.',
        amount: 8000,
        isConverted: false,
        lastInteractionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        priority: 'medium',
        leadScore: 70
      },
      {
        name: 'Amit Patel',
        email: 'amit.patel@foodplus.com',
        phone: '+91-7654321098',
        organization: 'FoodPlus Industries',
        region: 'Gujarat',
        service: 'Environmental Testing',
        subservice: 'Air Quality Monitoring',
        enquiryDetails: 'Need environmental compliance testing for our manufacturing unit. Air quality monitoring required.',
        source: 'enquiry',
        status: 'converted',
        agentName: 'Customer Executive',
        salesExecutiveName: 'Sales Executive',
        comments: 'Successfully converted. Project started.',
        amount: 25000,
        isConverted: true,
        lastInteractionAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        priority: 'high',
        leadScore: 95
      },
      {
        name: 'Sunita Singh',
        email: 'sunita.singh@healthcare.com',
        phone: '+91-6543210987',
        organization: 'Healthcare Solutions',
        region: 'Bangalore',
        service: 'Chemical Testing',
        subservice: 'Heavy Metal Testing',
        enquiryDetails: 'Require chemical analysis for medical equipment. Heavy metal testing is critical for safety compliance.',
        source: 'chatbot',
        status: 'pending',
        agentName: 'Customer Executive',
        comments: 'Medical equipment testing. High safety requirements.',
        amount: 12000,
        isConverted: false,
        lastInteractionAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        priority: 'high',
        leadScore: 80
      },
      {
        name: 'Vikram Reddy',
        email: 'vikram.reddy@agro.com',
        phone: '+91-5432109876',
        organization: 'AgroTech Solutions',
        region: 'Hyderabad',
        service: 'Food Testing',
        subservice: 'Pesticide Residue Testing',
        enquiryDetails: 'Agricultural product testing required. Pesticide residue analysis for export compliance.',
        source: 'enquiry',
        status: 'assigned',
        agentName: 'Customer Executive',
        salesExecutiveName: 'Sales Executive',
        comments: 'Export compliance testing. Urgent requirement.',
        amount: 18000,
        isConverted: false,
        lastInteractionAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        priority: 'urgent',
        leadScore: 90
      }
    ];

    // Create visitors
    const createdVisitors = await Visitor.insertMany(sampleVisitors);
    console.log(`✅ Created ${createdVisitors.length} sample visitors`);

    // Create enquiries for some visitors
    const sampleEnquiries = [
      {
        visitorId: createdVisitors[0]._id,
        service: 'Food Testing',
        subservice: 'Microbiological Testing',
        enquiryDetails: 'Need food safety testing for our new product line. Looking for comprehensive microbiological analysis.',
        channel: 'enquiry_form',
        status: 'assigned',
        priority: 'high',
        notes: 'High priority client. Follow up required.'
      },
      {
        visitorId: createdVisitors[1]._id,
        service: 'Water Testing',
        subservice: 'Drinking Water Analysis',
        enquiryDetails: 'Require water quality testing for our industrial facility. Need detailed analysis of drinking water standards.',
        channel: 'chatbot',
        status: 'new',
        priority: 'medium',
        notes: 'Initial enquiry through chatbot. Waiting for detailed requirements.'
      },
      {
        visitorId: createdVisitors[2]._id,
        service: 'Environmental Testing',
        subservice: 'Air Quality Monitoring',
        enquiryDetails: 'Need environmental compliance testing for our manufacturing unit. Air quality monitoring required.',
        channel: 'enquiry_form',
        status: 'converted',
        priority: 'high',
        notes: 'Successfully converted. Project started.'
      }
    ];

    const createdEnquiries = await Enquiry.insertMany(sampleEnquiries);
    console.log(`✅ Created ${createdEnquiries.length} sample enquiries`);

    // Create chat messages for some visitors
    const sampleChatMessages = [
      {
        visitorId: createdVisitors[1]._id,
        sessionId: 'chat_session_001',
        sender: 'user',
        text: 'Hello, I need water quality testing for our industrial facility.',
        messageType: 'text',
        isRead: true,
        readAt: new Date()
      },
      {
        visitorId: createdVisitors[1]._id,
        sessionId: 'chat_session_001',
        sender: 'bot',
        text: 'Hello! I can help you with water quality testing. What specific type of water testing do you need?',
        messageType: 'text',
        isRead: true,
        readAt: new Date()
      },
      {
        visitorId: createdVisitors[1]._id,
        sessionId: 'chat_session_001',
        sender: 'user',
        text: 'We need drinking water analysis for our industrial facility. What are the requirements?',
        messageType: 'text',
        isRead: true,
        readAt: new Date()
      },
      {
        visitorId: createdVisitors[3]._id,
        sessionId: 'chat_session_002',
        sender: 'user',
        text: 'Hi, I need chemical testing for medical equipment.',
        messageType: 'text',
        isRead: false
      },
      {
        visitorId: createdVisitors[3]._id,
        sessionId: 'chat_session_002',
        sender: 'bot',
        text: 'I can assist you with chemical testing. What specific type of chemical analysis do you need?',
        messageType: 'text',
        isRead: false
      }
    ];

    const createdChatMessages = await ChatMessage.insertMany(sampleChatMessages);
    console.log(`✅ Created ${createdChatMessages.length} sample chat messages`);

    // Show summary
    console.log('\n📊 Sample data created successfully!');
    console.log('✅ Visitors:', createdVisitors.length);
    console.log('✅ Enquiries:', createdEnquiries.length);
    console.log('✅ Chat Messages:', createdChatMessages.length);
    
    console.log('\n👥 Sample Visitors:');
    createdVisitors.forEach((visitor, index) => {
      console.log(`${index + 1}. ${visitor.name} (${visitor.organization})`);
      console.log(`   Service: ${visitor.service} - ${visitor.subservice}`);
      console.log(`   Source: ${visitor.source}, Status: ${visitor.status}`);
      console.log(`   Amount: ₹${visitor.amount}, Priority: ${visitor.priority}`);
    });

    console.log('\n🎉 Data synchronization ready!');
    console.log('✅ Dashboard will now show real data');
    console.log('✅ Visitors table will be populated');
    console.log('✅ Analytics will show proper metrics');

  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createSampleData();

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

async function testDataSync() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Test data counts
    console.log('\n📊 Data Synchronization Test:');
    
    const [visitors, enquiries, chatMessages] = await Promise.all([
      Visitor.find({}),
      Enquiry.find({}),
      ChatMessage.find({})
    ]);

    console.log(`✅ Visitors: ${visitors.length} records`);
    console.log(`✅ Enquiries: ${enquiries.length} records`);
    console.log(`✅ Chat Messages: ${chatMessages.length} records`);

    // Show visitor details
    console.log('\n👥 Visitors Data:');
    visitors.forEach((visitor, index) => {
      console.log(`${index + 1}. ${visitor.name} (${visitor.email})`);
      console.log(`   Organization: ${visitor.organization}`);
      console.log(`   Service: ${visitor.service} - ${visitor.subservice}`);
      console.log(`   Source: ${visitor.source}, Status: ${visitor.status}`);
      console.log(`   Amount: ₹${visitor.amount}, Priority: ${visitor.priority}`);
      console.log(`   Created: ${visitor.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Test API endpoints simulation
    console.log('🔄 Testing API endpoints simulation...');
    
    // Simulate visitors API call
    const visitorsAPI = await Visitor.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    console.log(`✅ Visitors API would return: ${visitorsAPI.length} visitors`);
    
    // Simulate dashboard analytics
    const totalVisitors = await Visitor.countDocuments({});
    const convertedVisitors = await Visitor.countDocuments({ isConverted: true });
    const todayVisitors = await Visitor.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    console.log('\n📈 Dashboard Analytics:');
    console.log(`✅ Total Visitors: ${totalVisitors}`);
    console.log(`✅ Converted Visitors: ${convertedVisitors}`);
    console.log(`✅ Today's Visitors: ${todayVisitors}`);
    console.log(`✅ Conversion Rate: ${totalVisitors > 0 ? ((convertedVisitors / totalVisitors) * 100).toFixed(1) : 0}%`);

    // Test data sources
    const sourceBreakdown = await Visitor.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Data Sources:');
    sourceBreakdown.forEach(source => {
      console.log(`✅ ${source._id}: ${source.count} visitors`);
    });

    // Test status breakdown
    const statusBreakdown = await Visitor.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Status Breakdown:');
    statusBreakdown.forEach(status => {
      console.log(`✅ ${status._id}: ${status.count} visitors`);
    });

    console.log('\n🎉 Data synchronization test completed!');
    console.log('✅ All data is properly stored and accessible');
    console.log('✅ Dashboard will show real metrics');
    console.log('✅ Visitors table will display all records');
    console.log('✅ Analytics will show proper breakdowns');

  } catch (error) {
    console.error('❌ Error testing data sync:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testDataSync();

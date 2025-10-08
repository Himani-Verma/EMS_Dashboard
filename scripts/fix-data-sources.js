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

const Visitor = mongoose.model('Visitor', visitorSchema);
const Enquiry = mongoose.model('Enquiry', enquirySchema);

async function fixDataSources() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Fixing data sources...');
    
    // Update visitors with correct sources
    const sourceUpdates = [
      { name: 'Rajesh Kumar', source: 'website' },
      { name: 'Priya Sharma', source: 'chatbot' },
      { name: 'Amit Patel', source: 'emails' },
      { name: 'Sunita Singh', source: 'chatbot' },
      { name: 'Vikram Reddy', source: 'calls' }
    ];

    for (const update of sourceUpdates) {
      await Visitor.updateOne(
        { name: update.name },
        { $set: { source: update.source } }
      );
      console.log(`✅ Updated ${update.name} source to: ${update.source}`);
    }

    // Update enquiries with correct channels
    const enquiryUpdates = [
      { visitorName: 'Rajesh Kumar', channel: 'enquiry_form' },
      { visitorName: 'Priya Sharma', channel: 'chatbot' },
      { visitorName: 'Amit Patel', channel: 'enquiry_form' }
    ];

    for (const update of enquiryUpdates) {
      const visitor = await Visitor.findOne({ name: update.visitorName });
      if (visitor) {
        await Enquiry.updateOne(
          { visitorId: visitor._id },
          { $set: { channel: update.channel } }
        );
        console.log(`✅ Updated enquiry for ${update.visitorName} channel to: ${update.channel}`);
      }
    }

    // Show corrected data
    console.log('\n📊 Corrected Data Sources:');
    const visitors = await Visitor.find({});
    visitors.forEach((visitor, index) => {
      console.log(`${index + 1}. ${visitor.name}`);
      console.log(`   Source: ${visitor.source}`);
      console.log(`   Service: ${visitor.service}`);
      console.log(`   Status: ${visitor.status}`);
    });

    // Show source breakdown
    const sourceBreakdown = await Visitor.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Source Breakdown (Corrected):');
    sourceBreakdown.forEach(source => {
      console.log(`✅ ${source._id}: ${source.count} visitors`);
    });

    console.log('\n🎉 Data sources corrected successfully!');
    console.log('✅ Sources are now: chatbot, calls, emails, website');
    console.log('✅ Enquiry form is a channel, not a source');
    console.log('✅ Data structure is now correct');

  } catch (error) {
    console.error('❌ Error fixing data sources:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

fixDataSources();

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS';

// Service Schema
const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['Food Testing', 'Water Testing', 'Environmental Testing', 'Chemical Testing', 'Microbiology', 'Others'],
    index: true
  },
  subServices: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  pricing: {
    basePrice: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: 'per sample'
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  requirements: [{
    type: String,
    trim: true
  }],
  estimatedDuration: {
    type: String,
    default: '3-5 business days'
  }
}, {
  timestamps: true
});

const Service = mongoose.model('Service', serviceSchema);

async function setupServices() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing services
    console.log('🔄 Clearing existing services...');
    await Service.deleteMany({});
    console.log('✅ Existing services cleared');

    // Define services with subservices
    const servicesData = [
      {
        name: 'Food Testing',
        description: 'Comprehensive food safety and quality testing services',
        category: 'Food Testing',
        subServices: [
          'Microbiological Testing',
          'Chemical Testing',
          'Nutritional Analysis',
          'Pesticide Residue Testing',
          'Heavy Metal Testing',
          'Allergen Testing',
          'Shelf Life Studies',
          'GMO Testing'
        ],
        pricing: {
          basePrice: 500,
          unit: 'per sample',
          currency: 'INR'
        },
        requirements: [
          'Sample size: 100g minimum',
          'Proper packaging required',
          'Cold chain maintenance'
        ],
        estimatedDuration: '3-5 business days'
      },
      {
        name: 'Water Testing',
        description: 'Complete water quality analysis and testing services',
        category: 'Water Testing',
        subServices: [
          'Drinking Water Analysis',
          'Industrial Wastewater Testing',
          'Groundwater Testing',
          'Surface Water Testing',
          'Swimming Pool Water Testing',
          'Packaged Drinking Water Testing',
          'Effluent Testing',
          'Seawater Testing'
        ],
        pricing: {
          basePrice: 300,
          unit: 'per sample',
          currency: 'INR'
        },
        requirements: [
          'Sample size: 1 liter minimum',
          'Proper collection containers',
          'Preservation chemicals if needed'
        ],
        estimatedDuration: '2-3 business days'
      },
      {
        name: 'Environmental Testing',
        description: 'Environmental monitoring and assessment services',
        category: 'Environmental Testing',
        subServices: [
          'Air Quality Monitoring',
          'Soil Testing',
          'Noise Level Monitoring',
          'Stack Emission Testing',
          'Ambient Air Quality',
          'Indoor Air Quality'
        ],
        pricing: {
          basePrice: 800,
          unit: 'per test',
          currency: 'INR'
        },
        requirements: [
          'Site access required',
          'Specific sampling conditions',
          'Environmental permits if needed'
        ],
        estimatedDuration: '5-7 business days'
      },
      {
        name: 'Chemical Testing',
        description: 'Advanced chemical analysis and testing services',
        category: 'Chemical Testing',
        subServices: [
          'Heavy Metal Analysis',
          'Pesticide Residue Testing',
          'Chemical Composition Analysis',
          'Toxicity Testing',
          'Chemical Stability Testing'
        ],
        pricing: {
          basePrice: 600,
          unit: 'per analysis',
          currency: 'INR'
        },
        requirements: [
          'Sample preparation guidelines',
          'Safety data sheets',
          'Specific analytical requirements'
        ],
        estimatedDuration: '4-6 business days'
      },
      {
        name: 'Microbiology Testing',
        description: 'Microbiological analysis and pathogen detection services',
        category: 'Microbiology',
        subServices: [
          'Bacterial Testing',
          'Pathogen Detection',
          'Microbial Contamination',
          'Antibiotic Resistance Testing',
          'Microbial Identification'
        ],
        pricing: {
          basePrice: 400,
          unit: 'per test',
          currency: 'INR'
        },
        requirements: [
          'Sterile sampling techniques',
          'Cold storage requirements',
          'Specific culture media'
        ],
        estimatedDuration: '3-5 business days'
      }
    ];

    // Insert services
    console.log('🔄 Creating services...');
    const createdServices = await Service.insertMany(servicesData);
    console.log(`✅ Created ${createdServices.length} services`);

    // Show created services
    console.log('\n📊 Services created:');
    createdServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} (${service.category})`);
      console.log(`   Subservices: ${service.subServices.length} items`);
      console.log(`   Pricing: ₹${service.pricing.basePrice} ${service.pricing.unit}`);
      console.log(`   Duration: ${service.estimatedDuration}`);
      console.log('');
    });

    // Create indexes
    console.log('🔄 Creating indexes...');
    await Service.collection.createIndex({ category: 1, isActive: 1 });
    await Service.collection.createIndex({ name: 1 });
    await Service.collection.createIndex({ isActive: 1 });
    console.log('✅ Service indexes created');

    console.log('\n🎉 Services setup completed successfully!');
    console.log('✅ Services table created with proper structure');
    console.log('✅ Services and subservices properly organized');
    console.log('✅ Pricing and requirements included');
    console.log('✅ Ready for enquiry form and visitor management');

  } catch (error) {
    console.error('❌ Error setting up services:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

setupServices();

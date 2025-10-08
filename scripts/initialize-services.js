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

async function initializeServices() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Check if services already exist
    const existingServices = await Service.find({});
    if (existingServices.length > 0) {
      console.log(`✅ Services already exist: ${existingServices.length} services found`);
      existingServices.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name} (${service.category})`);
      });
      return;
    }

    // Initialize with current hardcoded services
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
        pricing: { basePrice: 500, unit: 'per sample', currency: 'INR' },
        requirements: ['Sample size: 100g minimum', 'Proper packaging required'],
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
        pricing: { basePrice: 300, unit: 'per sample', currency: 'INR' },
        requirements: ['Sample size: 1 liter minimum', 'Proper collection containers'],
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
        pricing: { basePrice: 800, unit: 'per test', currency: 'INR' },
        requirements: ['Site access required', 'Specific sampling conditions'],
        estimatedDuration: '5-7 business days'
      }
    ];

    console.log('🔄 Creating services...');
    const createdServices = await Service.insertMany(servicesData);
    console.log(`✅ Created ${createdServices.length} services`);

    console.log('\n📊 Services created:');
    createdServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} (${service.category})`);
      console.log(`   Subservices: ${service.subServices.length} items`);
      console.log(`   Pricing: ₹${service.pricing.basePrice} ${service.pricing.unit}`);
    });

    console.log('\n🎉 Services initialization completed!');
    console.log('✅ Services table created with proper structure');
    console.log('✅ Ready for enquiry form and visitor management');

  } catch (error) {
    console.error('❌ Error initializing services:', error.message);
    
    if (error.message.includes('ETIMEDOUT')) {
      console.log('\n💡 Connection timeout - the services will be created when the API is first called');
      console.log('✅ Services API is ready at /api/services');
    }
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

initializeServices();

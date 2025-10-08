import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Service from '@/lib/models/Service';
import { corsHeaders } from '@/lib/cors';

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/services - Get all services with subservices
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/services - Fetching services');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Get all active services
    const services = await Service.find({ isActive: true })
      .select('name description category subServices pricing estimatedDuration')
      .sort({ category: 1, name: 1 })
      .lean();

    console.log(`📊 Found ${services.length} services`);

    // Group services by category
    const servicesByCategory = services.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push({
        _id: service._id.toString(),
        name: service.name,
        description: service.description,
        subServices: service.subServices,
        pricing: service.pricing,
        estimatedDuration: service.estimatedDuration
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      services: servicesByCategory,
      totalServices: services.length
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Services API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch services',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/services - Create new service (Admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/services - Creating new service');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const body = await request.json();
    const { name, description, category, subServices, pricing, requirements, estimatedDuration } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json({
        success: false,
        message: 'Service name and category are required'
      }, { status: 400, headers: corsHeaders });
    }

    // Check if service already exists
    const existingService = await Service.findOne({ name: name.trim() });
    if (existingService) {
      return NextResponse.json({
        success: false,
        message: 'Service with this name already exists'
      }, { status: 409, headers: corsHeaders });
    }

    // Create new service
    const newService = new Service({
      name: name.trim(),
      description: description?.trim(),
      category: category,
      subServices: Array.isArray(subServices) ? subServices : [],
      pricing: pricing || { basePrice: 0, unit: 'per sample', currency: 'INR' },
      requirements: Array.isArray(requirements) ? requirements : [],
      estimatedDuration: estimatedDuration || '3-5 business days',
      isActive: true
    });

    await newService.save();
    console.log('✅ Service created successfully:', newService._id);

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      service: {
        _id: newService._id,
        name: newService.name,
        description: newService.description,
        category: newService.category,
        subServices: newService.subServices,
        pricing: newService.pricing,
        estimatedDuration: newService.estimatedDuration
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Create service API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create service',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: corsHeaders });
  }
}

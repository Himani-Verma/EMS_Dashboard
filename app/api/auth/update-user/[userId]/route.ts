import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

async function updateUser(request: NextRequest, context?: { params: Promise<{ userId: string }> }) {
  try {
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const params = await context?.params;
    if (!params?.userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    const { userId } = params;
    console.log('🔄 PUT /api/auth/update-user - Updating user:', userId);

    const body = await request.json();
    const { name, email, phone, role, region, password } = body;

    // Find the user to update
    const userToUpdate = await User.findById(userId);
    
    if (!userToUpdate) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Update user fields
    userToUpdate.name = name;
    userToUpdate.email = email;
    userToUpdate.phone = phone;
    userToUpdate.role = role;
    userToUpdate.region = region;

    // Update password if provided
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      userToUpdate.password = await bcrypt.hash(password, salt);
    }
    
    await userToUpdate.save();
    
    console.log(`✅ User updated successfully: ${userToUpdate.name} (${userToUpdate.email})`);

    return NextResponse.json({
      success: true,
      message: `User ${userToUpdate.name} has been updated successfully`,
      user: {
        _id: userToUpdate._id,
        name: userToUpdate.name,
        email: userToUpdate.email,
        role: userToUpdate.role,
        region: userToUpdate.region,
        phone: userToUpdate.phone
      }
    });

  } catch (error) {
    console.error('❌ Update user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const PUT = async (request: NextRequest, context?: { params: Promise<{ userId: string }> }) => {
  try {
    console.log('🔄 PUT /api/auth/update-user - API called');
    console.log('Context:', context);
    
    // Extract userId from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1];
    
    console.log('Extracted userId from URL:', userId);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    // Create a mock context with the extracted userId
    const mockContext = {
      params: Promise.resolve({ userId })
    };

    return await updateUser(request, mockContext);
  } catch (error) {
    console.error('Update user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

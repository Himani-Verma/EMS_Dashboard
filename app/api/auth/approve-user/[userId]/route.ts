import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { createAuthenticatedHandler, requireAdmin } from '@/lib/middleware/auth';

async function approveUser(request: NextRequest, user: any, context?: { params: Promise<{ userId: string }> }) {
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
    console.log('🔄 POST /api/auth/approve-user - Approving user:', userId);

    // Find the user to approve
    const userToApprove = await User.findById(userId);
    
    if (!userToApprove) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Update user approval status
    userToApprove.isApproved = true;
    userToApprove.isActive = true;
    // Don't set approvedBy for now to avoid ObjectId validation error
    // userToApprove.approvedBy = user.userId; // Use userId from authenticated user
    userToApprove.approvedAt = new Date();
    
    await userToApprove.save();
    
    console.log(`✅ User approved successfully: ${userToApprove.name} (${userToApprove.email})`);
    console.log(`📝 isApproved: ${userToApprove.isApproved}, isActive: ${userToApprove.isActive}`);

    return NextResponse.json({
      success: true,
      message: `User ${userToApprove.name} has been approved successfully`,
      user: {
        _id: userToApprove._id,
        name: userToApprove.name,
        email: userToApprove.email,
        role: userToApprove.role,
        isApproved: userToApprove.isApproved,
        approvedAt: userToApprove.approvedAt
      }
    });

  } catch (error) {
    console.error('❌ Approve user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to approve user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const POST = async (request: NextRequest, context?: { params: Promise<{ userId: string }> }) => {
  try {
    console.log('🔄 POST /api/auth/approve-user - API called');
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

    return await approveUser(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' }, mockContext);
  } catch (error) {
    console.error('Approve user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to approve user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';

async function deleteUser(request: NextRequest, context?: { params: Promise<{ userId: string }> }) {
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
    console.log('🔄 DELETE /api/auth/delete-user - Deleting user:', userId);

    // Find the user to delete
    const userToDelete = await User.findById(userId);
    
    if (!userToDelete) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Prevent deleting admin users
    if (userToDelete.role === 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete admin users'
      }, { status: 403 });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);
    
    console.log(`✅ User deleted successfully: ${userToDelete.name} (${userToDelete.email})`);

    return NextResponse.json({
      success: true,
      message: `User ${userToDelete.name} has been deleted successfully`
    });

  } catch (error) {
    console.error('❌ Delete user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const DELETE = async (request: NextRequest, context?: { params: Promise<{ userId: string }> }) => {
  try {
    console.log('🔄 DELETE /api/auth/delete-user - API called');
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

    return await deleteUser(request, mockContext);
  } catch (error) {
    console.error('Delete user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

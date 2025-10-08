import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import ChatMessage from '@/lib/models/ChatMessage';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function getConversationData(request: NextRequest, user: any, context?: { params: Promise<{ visitorId: string }> }) {
  try {
    console.log('🔄 GET /api/chat-history/[visitorId] - Fetching conversation data');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const params = await context?.params;
    if (!params?.visitorId) {
      return NextResponse.json({
        success: false,
        message: 'Visitor ID is required'
      }, { status: 400 });
    }

    const { visitorId } = params;
    console.log('📊 Fetching conversation for visitor:', visitorId);

    // Get visitor details
    const visitor = await Visitor.findById(visitorId).lean();
    if (!visitor) {
      console.log('❌ Visitor not found:', visitorId);
      return NextResponse.json({
        success: false,
        message: 'Visitor not found'
      }, { status: 404 });
    }

    // Get chat messages for this visitor
    const messages = await ChatMessage.find({ visitorId })
      .sort({ at: 1 })
      .lean();

    console.log(`📊 Found ${messages.length} messages for visitor ${visitorId}`);

    // Transform the data for frontend
    const conversationData = {
      visitor: {
        _id: visitor._id.toString(),
        name: visitor.name || 'Anonymous',
        email: visitor.email || '',
        phone: visitor.phone || '',
        organization: visitor.organization || '',
        service: visitor.service || 'General Inquiry',
        source: visitor.source || 'chatbot',
        status: visitor.status || 'enquiry_required',
        createdAt: visitor.createdAt,
        lastInteractionAt: visitor.lastInteractionAt,
        isConverted: visitor.isConverted || false
      },
      messages: messages.map(msg => ({
        _id: msg._id.toString(),
        visitorId: msg.visitorId.toString(),
        sender: msg.sender,
        message: msg.message,
        at: msg.at
      }))
    };

    console.log('✅ Conversation data fetched successfully');

    return NextResponse.json({
      success: true,
      ...conversationData
    });

  } catch (error) {
    console.error('❌ Conversation data API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch conversation data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = createAuthenticatedHandler(getConversationData, requireAdminOrExecutive);

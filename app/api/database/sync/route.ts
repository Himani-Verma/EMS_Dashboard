import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseSync, databaseHealthCheck } from '@/lib/database-sync';
import { corsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/database/sync - Check database synchronization status
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/database/sync - Checking database sync status');
    
    const healthCheck = await databaseHealthCheck();
    
    return NextResponse.json({
      success: true,
      healthy: healthCheck.healthy,
      primaryConnected: healthCheck.primaryConnected,
      backupConnected: healthCheck.backupConnected,
      syncStatus: healthCheck.syncStatus,
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('❌ Database sync API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to check database sync status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/database/sync - Force database synchronization
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/database/sync - Force database synchronization');
    
    const syncSuccess = await ensureDatabaseSync();
    
    if (syncSuccess) {
      return NextResponse.json({
        success: true,
        message: 'Database synchronization completed successfully',
        timestamp: new Date().toISOString()
      }, { headers: corsHeaders });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Database synchronization failed',
        timestamp: new Date().toISOString()
      }, { status: 500, headers: corsHeaders });
    }
    
  } catch (error) {
    console.error('❌ Database sync API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to synchronize databases',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: corsHeaders });
  }
}

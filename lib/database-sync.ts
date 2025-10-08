// Database Synchronization Utility
// Ensures data consistency across all databases

import mongoose from 'mongoose';
import User from './models/User';
import Visitor from './models/Visitor';
import Enquiry from './models/Enquiry';
import ChatMessage from './models/ChatMessage';

// Database configuration
export const DATABASE_CONFIG = {
  // Primary database (where app should connect)
  PRIMARY: process.env.MONGODB_URI || 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/ems?retryWrites=true&w=majority&appName=EMS',
  // Backup database (where scripts might connect)
  BACKUP: 'mongodb+srv://himani:ems@ems.z3zxn2h.mongodb.net/?retryWrites=true&w=majority&appName=EMS'
};

export interface SyncResult {
  synchronized: boolean;
  primaryCount: {
    users: number;
    visitors: number;
    enquiries: number;
    chatMessages: number;
  };
  backupCount: {
    users: number;
    visitors: number;
    enquiries: number;
    chatMessages: number;
  };
  differences: {
    users: number;
    visitors: number;
    enquiries: number;
    chatMessages: number;
  };
  lastSync: Date;
}

// Check database synchronization
export async function checkDatabaseSync(): Promise<SyncResult> {
  try {
    console.log('🔄 Checking database synchronization...');
    
    // Connect to primary database
    await mongoose.connect(DATABASE_CONFIG.PRIMARY, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    const primaryCount = {
      users: await User.countDocuments(),
      visitors: await Visitor.countDocuments(),
      enquiries: await Enquiry.countDocuments(),
      chatMessages: await ChatMessage.countDocuments()
    };
    
    await mongoose.disconnect();
    
    // Connect to backup database
    await mongoose.connect(DATABASE_CONFIG.BACKUP, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    const backupCount = {
      users: await User.countDocuments(),
      visitors: await Visitor.countDocuments(),
      enquiries: await Enquiry.countDocuments(),
      chatMessages: await ChatMessage.countDocuments()
    };
    
    await mongoose.disconnect();
    
    const differences = {
      users: primaryCount.users - backupCount.users,
      visitors: primaryCount.visitors - backupCount.visitors,
      enquiries: primaryCount.enquiries - backupCount.enquiries,
      chatMessages: primaryCount.chatMessages - backupCount.chatMessages
    };
    
    const synchronized = Object.values(differences).every(diff => diff === 0);
    
    console.log('📊 Database sync check completed');
    console.log(`   Primary: ${primaryCount.users} users, ${primaryCount.visitors} visitors`);
    console.log(`   Backup: ${backupCount.users} users, ${backupCount.visitors} visitors`);
    console.log(`   Synchronized: ${synchronized ? 'YES' : 'NO'}`);
    
    return {
      synchronized,
      primaryCount,
      backupCount,
      differences,
      lastSync: new Date()
    };
    
  } catch (error) {
    console.error('❌ Database sync check failed:', error);
    throw error;
  }
}

// Auto-sync databases
export async function autoSyncDatabases(): Promise<boolean> {
  try {
    console.log('🔄 Auto-syncing databases...');
    
    // Get data from backup database
    await mongoose.connect(DATABASE_CONFIG.BACKUP, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    const backupData = {
      users: await User.find({}).lean(),
      visitors: await Visitor.find({}).lean(),
      enquiries: await Enquiry.find({}).lean(),
      chatMessages: await ChatMessage.find({}).lean()
    };
    
    console.log(`📥 Retrieved data from backup: ${backupData.users.length} users, ${backupData.visitors.length} visitors`);
    
    await mongoose.disconnect();
    
    // Sync to primary database
    await mongoose.connect(DATABASE_CONFIG.PRIMARY, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    // Clear and sync all collections
    await User.deleteMany({});
    await User.insertMany(backupData.users);
    console.log(`✅ Synced ${backupData.users.length} users`);
    
    await Visitor.deleteMany({});
    await Visitor.insertMany(backupData.visitors);
    console.log(`✅ Synced ${backupData.visitors.length} visitors`);
    
    await Enquiry.deleteMany({});
    await Enquiry.insertMany(backupData.enquiries);
    console.log(`✅ Synced ${backupData.enquiries.length} enquiries`);
    
    await ChatMessage.deleteMany({});
    await ChatMessage.insertMany(backupData.chatMessages);
    console.log(`✅ Synced ${backupData.chatMessages.length} chat messages`);
    
    await mongoose.disconnect();
    console.log('✅ Auto-sync completed successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Auto-sync failed:', error);
    return false;
  }
}

// Ensure database synchronization
export async function ensureDatabaseSync(): Promise<boolean> {
  try {
    const syncResult = await checkDatabaseSync();
    
    if (!syncResult.synchronized) {
      console.log('⚠️  Database inconsistency detected, auto-syncing...');
      const syncSuccess = await autoSyncDatabases();
      
      if (syncSuccess) {
        // Re-check after sync
        const recheckResult = await checkDatabaseSync();
        if (recheckResult.synchronized) {
          console.log('✅ Databases are now synchronized');
          return true;
        }
      }
      
      console.log('❌ Auto-sync failed - manual intervention required');
      return false;
    }
    
    console.log('✅ Databases are synchronized');
    return true;
    
  } catch (error) {
    console.error('❌ Database sync check failed:', error);
    return false;
  }
}

// Database health check
export async function databaseHealthCheck(): Promise<{
  healthy: boolean;
  primaryConnected: boolean;
  backupConnected: boolean;
  syncStatus: SyncResult | null;
}> {
  try {
    let primaryConnected = false;
    let backupConnected = false;
    let syncStatus: SyncResult | null = null;
    
    // Test primary connection
    try {
      await mongoose.connect(DATABASE_CONFIG.PRIMARY, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });
      primaryConnected = true;
      await mongoose.disconnect();
    } catch (error) {
      console.error('❌ Primary database connection failed:', error);
    }
    
    // Test backup connection
    try {
      await mongoose.connect(DATABASE_CONFIG.BACKUP, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });
      backupConnected = true;
      await mongoose.disconnect();
    } catch (error) {
      console.error('❌ Backup database connection failed:', error);
    }
    
    // Check sync status if both connected
    if (primaryConnected && backupConnected) {
      try {
        syncStatus = await checkDatabaseSync();
      } catch (error) {
        console.error('❌ Sync check failed:', error);
      }
    }
    
    const healthy = primaryConnected && backupConnected && (syncStatus?.synchronized ?? false);
    
    return {
      healthy,
      primaryConnected,
      backupConnected,
      syncStatus
    };
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return {
      healthy: false,
      primaryConnected: false,
      backupConnected: false,
      syncStatus: null
    };
  }
}

export default {
  checkDatabaseSync,
  autoSyncDatabases,
  ensureDatabaseSync,
  databaseHealthCheck
};

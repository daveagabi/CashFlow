const express = require('express');
const router = express.Router();
const { getFirestore } = require('../config/firebase');

// POST /api/sync - Sync offline transactions to cloud and ServiceNow
router.post('/', async (req, res) => {
  try {
    const { transactions, userId, lastSyncTimestamp } = req.body;

    if (!transactions || !Array.isArray(transactions) || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['transactions (array)', 'userId']
      });
    }

    console.log(`🔄 Syncing ${transactions.length} transactions for user ${userId}`);

    // Initialize Firebase
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();

    // Initialize ServiceNow
    const ServiceNowIntegration = require('../servicenow');
    const serviceNow = new ServiceNowIntegration();

    const syncResults = {
      uploaded: 0,
      failed: 0,
      duplicates: 0,
      serviceNowLogs: 0,
      serviceNowFailed: 0,
      errors: []
    };

    let allTransactions = [];

    // Process each transaction
    for (const transaction of transactions) {
      try {
        // Check if transaction already exists (prevent duplicates)
        if (transaction.tempId || transaction.offlineId) {
          const existingQuery = await db.collection('transactions')
            .where('userId', '==', userId)
            .where('amount', '==', transaction.amount)
            .where('description', '==', transaction.description)
            .where('createdAt', '==', transaction.createdAt)
            .limit(1)
            .get();

          if (!existingQuery.empty) {
            syncResults.duplicates++;
            continue;
          }
        }

        // Prepare transaction for upload
        const transactionData = {
          amount: parseFloat(transaction.amount),
          description: transaction.description || 'Offline transaction',
          category: transaction.category || 'other',
          type: transaction.type || 'expense',
          userId: userId,
          voiceData: transaction.voiceData || null,
          createdAt: transaction.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncedAt: new Date().toISOString(),
          source: 'offline-sync'
        };

        // Save to Firestore
        const docRef = await db.collection('transactions').add(transactionData);
        
        const savedTransaction = {
          id: docRef.id,
          ...transactionData
        };

        allTransactions.push(savedTransaction);
        syncResults.uploaded++;
        console.log(`✅ Synced transaction: ${docRef.id}`);

      } catch (error) {
        syncResults.failed++;
        syncResults.errors.push({
          transaction: transaction.description || 'Unknown',
          error: error.message
        });
        console.error(`❌ Failed to sync transaction:`, error.message);
      }
    }

    // Auto-log summary to ServiceNow u_cashflow_logs table
    if (allTransactions.length > 0) {
      try {
        const summary = generateSyncSummary(allTransactions, userId);
        const serviceNowResult = await serviceNow.logSyncSummary(summary);
        
        if (serviceNowResult) {
          syncResults.serviceNowLogs++;
          console.log('📋 Summary logged to ServiceNow u_cashflow_logs');
        }
      } catch (serviceNowError) {
        syncResults.serviceNowFailed++;
        console.log('⚠️ ServiceNow logging failed:', serviceNowError.message);
        
        // Retry on fail as specified in requirements
        try {
          console.log('🔄 Retrying ServiceNow logging...');
          const summary = generateSyncSummary(allTransactions, userId);
          await serviceNow.logSyncSummary(summary);
          syncResults.serviceNowLogs++;
          console.log('✅ ServiceNow retry successful');
        } catch (retryError) {
          console.log('❌ ServiceNow retry failed:', retryError.message);
        }
      }
    }

    // Get updated transactions since last sync
    let updatedTransactions = [];
    if (lastSyncTimestamp) {
      try {
        const updatedQuery = await db.collection('transactions')
          .where('userId', '==', userId)
          .where('updatedAt', '>', lastSyncTimestamp)
          .orderBy('updatedAt', 'desc')
          .limit(100)
          .get();

        updatedTransactions = updatedQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.log('⚠️ Could not fetch updated transactions:', error.message);
      }
    }

    res.json({
      success: true,
      message: 'Sync completed with ServiceNow integration',
      syncResults,
      updatedTransactions,
      syncTimestamp: new Date().toISOString(),
      summary: {
        totalProcessed: transactions.length,
        uploaded: syncResults.uploaded,
        failed: syncResults.failed,
        duplicates: syncResults.duplicates,
        serviceNowLogs: syncResults.serviceNowLogs,
        serviceNowFailed: syncResults.serviceNowFailed
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      error: 'Sync failed',
      message: error.message
    });
  }
});

// Helper function to generate sync summary for ServiceNow
const generateSyncSummary = (transactions, userId) => {
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const expenseCount = transactions.filter(t => t.type === 'expense').length;
  const incomeCount = transactions.filter(t => t.type === 'income').length;
  
  const categories = {};
  transactions.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  });

  return {
    userId,
    syncTimestamp: new Date().toISOString(),
    transactionCount: transactions.length,
    totalAmount,
    expenseCount,
    incomeCount,
    topCategory: Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b, 'none'),
    categoryBreakdown: categories,
    source: 'cashflow-sync'
  };
};

// GET /api/sync/status/:userId - Get sync status for user
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    require('../config/firebase').initializeFirebase();
    const db = getFirestore();

    // Get latest transaction timestamp
    const latestQuery = await db.collection('transactions')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    let lastSyncTimestamp = null;
    let totalTransactions = 0;

    if (!latestQuery.empty) {
      const latestDoc = latestQuery.docs[0];
      lastSyncTimestamp = latestDoc.data().updatedAt;
    }

    // Get total transaction count
    const countQuery = await db.collection('transactions')
      .where('userId', '==', userId)
      .get();
    
    totalTransactions = countQuery.size;

    res.json({
      success: true,
      data: {
        userId,
        lastSyncTimestamp,
        totalTransactions,
        serverTimestamp: new Date().toISOString(),
        syncRequired: false // Frontend can determine this
      }
    });

  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      error: 'Failed to get sync status',
      message: error.message
    });
  }
});

// POST /api/sync/batch - Batch sync with conflict resolution
router.post('/batch', async (req, res) => {
  try {
    const { operations, userId } = req.body;

    if (!operations || !Array.isArray(operations) || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['operations (array)', 'userId']
      });
    }

    console.log(`🔄 Processing ${operations.length} batch operations for user ${userId}`);

    require('../config/firebase').initializeFirebase();
    const db = getFirestore();

    const results = {
      created: 0,
      updated: 0,
      deleted: 0,
      failed: 0,
      conflicts: []
    };

    for (const operation of operations) {
      try {
        const { type, data, id } = operation;

        switch (type) {
          case 'CREATE':
            const createData = {
              ...data,
              userId,
              updatedAt: new Date().toISOString(),
              source: 'batch-sync'
            };
            await db.collection('transactions').add(createData);
            results.created++;
            break;

          case 'UPDATE':
            if (id) {
              await db.collection('transactions').doc(id).update({
                ...data,
                updatedAt: new Date().toISOString()
              });
              results.updated++;
            }
            break;

          case 'DELETE':
            if (id) {
              await db.collection('transactions').doc(id).delete();
              results.deleted++;
            }
            break;

          default:
            throw new Error(`Unknown operation type: ${type}`);
        }

      } catch (error) {
        results.failed++;
        results.conflicts.push({
          operation: operation.type,
          id: operation.id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Batch sync completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch sync error:', error);
    res.status(500).json({
      error: 'Batch sync failed',
      message: error.message
    });
  }
});

module.exports = router;
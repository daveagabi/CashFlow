const express = require('express');
const router = express.Router();
const { getFirestore } = require('../config/firebase');

// GET /api/logs/sync/:userId - Get last 10 sync events for user
router.get('/sync/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`📋 Getting last ${limit} sync events for user ${userId}`);

    // Initialize Firebase
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();

    // Get sync events from sync_logs collection
    const syncLogsQuery = await db.collection('sync_logs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const syncEvents = [];
    syncLogsQuery.forEach(doc => {
      syncEvents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // If no sync logs exist, create sample data for demo
    if (syncEvents.length === 0) {
      const sampleEvents = generateSampleSyncEvents(userId);
      
      // Save sample events to database
      for (const event of sampleEvents) {
        await db.collection('sync_logs').add(event);
        syncEvents.push(event);
      }
    }

    res.json({
      success: true,
      message: `Retrieved ${syncEvents.length} sync events`,
      data: {
        userId,
        syncEvents: syncEvents.slice(0, parseInt(limit)),
        totalEvents: syncEvents.length,
        lastSyncTime: syncEvents.length > 0 ? syncEvents[0].timestamp : null
      }
    });

  } catch (error) {
    console.error('Sync logs error:', error);
    res.status(500).json({
      error: 'Failed to retrieve sync logs',
      message: error.message
    });
  }
});

// POST /api/logs/sync - Log a sync event
router.post('/sync', async (req, res) => {
  try {
    const { userId, eventType, transactionCount, status, details } = req.body;

    if (!userId || !eventType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'eventType']
      });
    }

    // Initialize Firebase
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();

    const syncEvent = {
      userId,
      eventType, // 'offline-sync', 'manual-sync', 'auto-sync', 'servicenow-sync'
      transactionCount: transactionCount || 0,
      status: status || 'success', // 'success', 'failed', 'partial'
      details: details || {},
      timestamp: new Date().toISOString(),
      source: 'cashflow-backend'
    };

    const docRef = await db.collection('sync_logs').add(syncEvent);

    console.log(`📝 Logged sync event: ${eventType} for user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Sync event logged successfully',
      data: {
        id: docRef.id,
        ...syncEvent
      }
    });

  } catch (error) {
    console.error('Log sync event error:', error);
    res.status(500).json({
      error: 'Failed to log sync event',
      message: error.message
    });
  }
});

// GET /api/logs/system - Get system-wide sync statistics
router.get('/system', async (req, res) => {
  try {
    console.log('📊 Getting system-wide sync statistics');

    // Initialize Firebase
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();

    // Get recent sync events (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentEventsQuery = await db.collection('sync_logs')
      .where('timestamp', '>=', yesterday.toISOString())
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const events = [];
    recentEventsQuery.forEach(doc => {
      events.push(doc.data());
    });

    // Calculate statistics
    const stats = {
      totalSyncs: events.length,
      successfulSyncs: events.filter(e => e.status === 'success').length,
      failedSyncs: events.filter(e => e.status === 'failed').length,
      totalTransactions: events.reduce((sum, e) => sum + (e.transactionCount || 0), 0),
      uniqueUsers: [...new Set(events.map(e => e.userId))].length,
      syncTypes: {
        'offline-sync': events.filter(e => e.eventType === 'offline-sync').length,
        'manual-sync': events.filter(e => e.eventType === 'manual-sync').length,
        'auto-sync': events.filter(e => e.eventType === 'auto-sync').length,
        'servicenow-sync': events.filter(e => e.eventType === 'servicenow-sync').length
      },
      lastSync: events.length > 0 ? events[0].timestamp : null
    };

    res.json({
      success: true,
      message: 'System statistics retrieved',
      data: {
        period: '24 hours',
        statistics: stats,
        recentEvents: events.slice(0, 10) // Last 10 events
      }
    });

  } catch (error) {
    console.error('System logs error:', error);
    res.status(500).json({
      error: 'Failed to retrieve system statistics',
      message: error.message
    });
  }
});

// Helper function to generate sample sync events for demo
const generateSampleSyncEvents = (userId) => {
  const now = new Date();
  const events = [];

  const eventTypes = ['offline-sync', 'manual-sync', 'auto-sync', 'servicenow-sync'];
  const statuses = ['success', 'success', 'success', 'failed']; // Mostly successful

  for (let i = 0; i < 10; i++) {
    const eventTime = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000)); // Every 2 hours
    const eventType = eventTypes[i % eventTypes.length];
    const status = statuses[i % statuses.length];

    events.push({
      userId,
      eventType,
      transactionCount: Math.floor(Math.random() * 10) + 1,
      status,
      details: {
        duration: Math.floor(Math.random() * 5000) + 500, // 500-5500ms
        syncedBytes: Math.floor(Math.random() * 10000) + 1000,
        conflicts: status === 'failed' ? Math.floor(Math.random() * 3) : 0
      },
      timestamp: eventTime.toISOString(),
      source: 'demo-data'
    });
  }

  return events;
};

module.exports = router;
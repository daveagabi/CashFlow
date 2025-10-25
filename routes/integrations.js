const express = require('express');
const router = express.Router();
const ServiceNowIntegration = require('../servicenow');
const WhatsAppIntegration = require('../whatsapp');

// Initialize integrations
const serviceNow = new ServiceNowIntegration();
const whatsApp = new WhatsAppIntegration();

// Test all integrations
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing integrations...');

    const results = {
      servicenow: await serviceNow.testConnection(),
      whatsapp: await whatsApp.testConnection(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Integration tests completed',
      results
    });

  } catch (error) {
    console.error('Integration test error:', error);
    res.status(500).json({
      error: 'Integration test failed',
      message: error.message
    });
  }
});

// ServiceNow endpoints
router.post('/servicenow/alert', async (req, res) => {
  try {
    const { transactionData } = req.body;
    
    if (!transactionData) {
      return res.status(400).json({
        error: 'Missing transaction data'
      });
    }

    const incident = await serviceNow.createSpendingAlert(transactionData);
    
    res.json({
      success: true,
      message: 'ServiceNow alert created',
      incident
    });

  } catch (error) {
    console.error('ServiceNow alert error:', error);
    res.status(500).json({
      error: 'Failed to create ServiceNow alert',
      message: error.message
    });
  }
});

router.get('/servicenow/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const insights = await serviceNow.getSpendingInsights(userId);
    
    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('ServiceNow insights error:', error);
    res.status(500).json({
      error: 'Failed to get ServiceNow insights',
      message: error.message
    });
  }
});

// Get ServiceNow sync logs
router.get('/servicenow/logs/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    const logs = await serviceNow.getSyncLogs(userId, parseInt(limit));
    
    res.json({
      success: true,
      message: 'ServiceNow logs retrieved',
      data: logs
    });

  } catch (error) {
    console.error('ServiceNow logs error:', error);
    res.status(500).json({
      error: 'Failed to get ServiceNow logs',
      message: error.message
    });
  }
});

// Manual ServiceNow sync
router.post('/servicenow/sync', async (req, res) => {
  try {
    const { userId, transactions } = req.body;
    
    if (!userId || !transactions) {
      return res.status(400).json({
        error: 'Missing userId or transactions'
      });
    }

    // Generate summary and log to ServiceNow
    const summary = {
      userId,
      syncTimestamp: new Date().toISOString(),
      transactionCount: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      expenseCount: transactions.filter(t => t.type === 'expense').length,
      incomeCount: transactions.filter(t => t.type === 'income').length,
      topCategory: 'manual-sync',
      categoryBreakdown: {},
      source: 'manual-sync'
    };

    const result = await serviceNow.logSyncSummary(summary);
    
    res.json({
      success: true,
      message: 'Manual sync to ServiceNow completed',
      result
    });

  } catch (error) {
    console.error('Manual ServiceNow sync error:', error);
    res.status(500).json({
      error: 'Manual sync failed',
      message: error.message
    });
  }
});

// WhatsApp endpoints
router.post('/whatsapp/send', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        error: 'Missing phoneNumber or message'
      });
    }

    const result = await whatsApp.sendMessage(phoneNumber, message);
    
    res.json({
      success: true,
      message: 'WhatsApp message sent',
      result
    });

  } catch (error) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({
      error: 'Failed to send WhatsApp message',
      message: error.message
    });
  }
});

router.post('/whatsapp/spending-alert', async (req, res) => {
  try {
    const { phoneNumber, transactionData } = req.body;
    
    if (!phoneNumber || !transactionData) {
      return res.status(400).json({
        error: 'Missing phoneNumber or transactionData'
      });
    }

    const result = await whatsApp.sendSpendingAlert(phoneNumber, transactionData);
    
    res.json({
      success: true,
      message: 'Spending alert sent via WhatsApp',
      result
    });

  } catch (error) {
    console.error('WhatsApp spending alert error:', error);
    res.status(500).json({
      error: 'Failed to send spending alert',
      message: error.message
    });
  }
});

router.post('/whatsapp/daily-summary', async (req, res) => {
  try {
    const { phoneNumber, summaryData } = req.body;
    
    if (!phoneNumber || !summaryData) {
      return res.status(400).json({
        error: 'Missing phoneNumber or summaryData'
      });
    }

    const result = await whatsApp.sendDailySummary(phoneNumber, summaryData);
    
    res.json({
      success: true,
      message: 'Daily summary sent via WhatsApp',
      result
    });

  } catch (error) {
    console.error('WhatsApp daily summary error:', error);
    res.status(500).json({
      error: 'Failed to send daily summary',
      message: error.message
    });
  }
});

// WhatsApp webhook for incoming messages
router.post('/whatsapp/webhook', async (req, res) => {
  try {
    console.log('📱 WhatsApp webhook received:', req.body);

    const messageData = whatsApp.processIncomingMessage(req.body);
    
    if (messageData) {
      // Try to parse expense from message
      const expenseData = whatsApp.parseExpenseMessage(messageData.message);
      
      if (expenseData) {
        console.log('💰 Parsed expense from WhatsApp:', expenseData);
        
        // You can integrate this with your transaction creation logic
        // For now, just log it
        await whatsApp.sendMessage(
          messageData.from, 
          `✅ Expense recorded: $${expenseData.amount} for ${expenseData.description}`
        );
      } else {
        // Send help message for unrecognized input
        await whatsApp.sendMessage(
          messageData.from,
          `Hi! I can help track your expenses. Try saying something like "I spent $20 on lunch" 💰`
        );
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

// WhatsApp webhook verification (required by Meta)
router.get('/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify token (you should set this in your environment)
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'cashflow_verify_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ WhatsApp webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

module.exports = router;
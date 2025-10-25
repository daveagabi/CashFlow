const express = require('express');
const router = express.Router();
const { getFirestore } = require('../config/firebase');

// Firebase will be initialized on first use

// POST /api/transactions - Create a new transaction
router.post('/', async (req, res) => {
  try {
    const { amount, description, category, type, userId, voiceData } = req.body;

    // Validation
    if (!amount || !description || !type || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['amount', 'description', 'type', 'userId']
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid transaction type',
        message: 'Type must be either "income" or "expense"'
      });
    }

    // Initialize Firebase if not already done
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();
    const transaction = {
      amount: parseFloat(amount),
      description: description.trim(),
      category: category || 'uncategorized',
      type,
      userId,
      voiceData: voiceData || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('transactions').add(transaction);
    
    const transactionWithId = {
      id: docRef.id,
      ...transaction
    };

    // Trigger integrations for large expenses (optional)
    if (transaction.amount > 100) {
      try {
        const ServiceNowIntegration = require('../servicenow');
        const serviceNow = new ServiceNowIntegration();
        await serviceNow.createSpendingAlert(transactionWithId);
        console.log('📋 ServiceNow alert created for large expense');
      } catch (error) {
        console.log('⚠️ ServiceNow integration skipped:', error.message);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transactionWithId
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      error: 'Failed to create transaction',
      message: error.message
    });
  }
});

// GET /api/transactions - Get user transactions
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 50, type, category } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter'
      });
    }

    // Initialize Firebase if not already done
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();
    let query = db.collection('transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (type) {
      query = query.where('type', '==', type);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    query = query.limit(parseInt(limit));

    const snapshot = await query.get();
    const transactions = [];

    snapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message
    });
  }
});

module.exports = router;
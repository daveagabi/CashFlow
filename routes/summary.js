const express = require('express');
const router = express.Router();
const { getFirestore } = require('../config/firebase');

// Firebase will be initialized on first use

// GET /api/summary - Get financial summary for user
router.get('/', async (req, res) => {
  try {
    const { userId, period = 'month' } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter'
      });
    }

    // Initialize Firebase if not already done
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Fetch transactions for the period
    const snapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .where('createdAt', '>=', startDate.toISOString())
      .get();

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown = {};
    const recentTransactions = [];

    snapshot.forEach(doc => {
      const transaction = { id: doc.id, ...doc.data() };
      
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += transaction.amount;
      }

      // Category breakdown
      const category = transaction.category || 'uncategorized';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { income: 0, expenses: 0 };
      }
      categoryBreakdown[category][transaction.type === 'income' ? 'income' : 'expenses'] += transaction.amount;

      recentTransactions.push(transaction);
    });

    // Sort recent transactions by date (most recent first)
    recentTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const summary = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: totalIncome - totalExpenses
      },
      categoryBreakdown,
      transactionCount: recentTransactions.length,
      recentTransactions: recentTransactions.slice(0, 10) // Last 10 transactions
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      error: 'Failed to generate summary',
      message: error.message
    });
  }
});

// GET /api/summary/categories - Get category-wise spending analysis
router.get('/categories', async (req, res) => {
  try {
    const { userId, period = 'month' } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter'
      });
    }

    // Initialize Firebase if not already done
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const snapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .where('createdAt', '>=', startDate.toISOString())
      .get();

    const categories = {};

    snapshot.forEach(doc => {
      const transaction = doc.data();
      const category = transaction.category || 'uncategorized';
      
      if (!categories[category]) {
        categories[category] = {
          name: category,
          totalAmount: 0,
          transactionCount: 0,
          transactions: []
        };
      }

      categories[category].totalAmount += transaction.amount;
      categories[category].transactionCount += 1;
      categories[category].transactions.push({
        id: doc.id,
        ...transaction
      });
    });

    // Convert to array and sort by total amount
    const categoryArray = Object.values(categories)
      .sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({
      success: true,
      data: {
        period,
        categories: categoryArray
      }
    });

  } catch (error) {
    console.error('Error fetching category analysis:', error);
    res.status(500).json({
      error: 'Failed to fetch category analysis',
      message: error.message
    });
  }
});

module.exports = router;
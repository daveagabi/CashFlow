const express = require('express');
const router = express.Router();
const { getFirestore } = require('../config/firebase');
const WhatsAppIntegration = require('../whatsapp');

// Initialize WhatsApp
const whatsApp = new WhatsAppIntegration();

// GET /api/sharing/weeklySummary/:userId - Generate weekly summary for sharing
router.get('/weeklySummary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'json' } = req.query;

    console.log(`📊 Generating weekly summary for user ${userId}`);

    // Initialize Firebase
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();

    // Calculate date range for this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch transactions for the week
    const snapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .where('createdAt', '>=', startOfWeek.toISOString())
      .where('createdAt', '<=', endOfWeek.toISOString())
      .get();

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown = {};
    const dailyBreakdown = {};
    const transactions = [];

    snapshot.forEach(doc => {
      const transaction = { id: doc.id, ...doc.data() };
      transactions.push(transaction);

      const amount = transaction.amount;
      const day = new Date(transaction.createdAt).toLocaleDateString();

      if (transaction.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }

      // Category breakdown
      const category = transaction.category || 'uncategorized';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { income: 0, expenses: 0, count: 0 };
      }
      categoryBreakdown[category][transaction.type === 'income' ? 'income' : 'expenses'] += amount;
      categoryBreakdown[category].count++;

      // Daily breakdown
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = { income: 0, expenses: 0, count: 0 };
      }
      dailyBreakdown[day][transaction.type === 'income' ? 'income' : 'expenses'] += amount;
      dailyBreakdown[day].count++;
    });

    // Find top spending category
    const topCategory = Object.keys(categoryBreakdown).reduce((a, b) => 
      categoryBreakdown[a].expenses > categoryBreakdown[b].expenses ? a : b, 'none'
    );

    // Calculate insights
    const netAmount = totalIncome - totalExpenses;
    const avgDailySpending = totalExpenses / 7;
    const transactionCount = transactions.length;

    const weeklySummary = {
      userId,
      period: {
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString(),
        week: `Week of ${startOfWeek.toLocaleDateString()}`
      },
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        net: netAmount,
        transactionCount
      },
      insights: {
        topSpendingCategory: topCategory,
        avgDailySpending: Math.round(avgDailySpending * 100) / 100,
        savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
        mostActiveDay: Object.keys(dailyBreakdown).reduce((a, b) => 
          dailyBreakdown[a].count > dailyBreakdown[b].count ? a : b, 'none'
        )
      },
      categoryBreakdown,
      dailyBreakdown,
      generatedAt: new Date().toISOString()
    };

    // Return different formats based on request
    if (format === 'whatsapp') {
      const whatsappText = formatSummaryForWhatsApp(weeklySummary);
      res.json({
        success: true,
        data: weeklySummary,
        whatsappText,
        shareUrl: `${req.protocol}://${req.get('host')}/api/sharing/view/${userId}?week=${startOfWeek.toISOString()}`
      });
    } else {
      res.json({
        success: true,
        data: weeklySummary,
        shareUrl: `${req.protocol}://${req.get('host')}/api/sharing/view/${userId}?week=${startOfWeek.toISOString()}`
      });
    }

  } catch (error) {
    console.error('Weekly summary error:', error);
    res.status(500).json({
      error: 'Failed to generate weekly summary',
      message: error.message
    });
  }
});

// POST /api/sharing/whatsapp - Share summary via WhatsApp
router.post('/whatsapp', async (req, res) => {
  try {
    const { userId, phoneNumber, summaryType = 'weekly' } = req.body;

    if (!userId || !phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'phoneNumber']
      });
    }

    console.log(`📱 Sharing ${summaryType} summary via WhatsApp for ${userId}`);

    // Get the summary
    const summaryResponse = await fetch(`${req.protocol}://${req.get('host')}/api/sharing/weeklySummary/${userId}?format=whatsapp`);
    const summaryData = await summaryResponse.json();

    if (!summaryData.success) {
      throw new Error('Failed to generate summary');
    }

    // Send via WhatsApp
    const whatsappResult = await whatsApp.sendMessage(phoneNumber, summaryData.whatsappText);

    // Add debt reminders (as specified in requirements)
    const debtReminders = generateDebtReminders(userId);
    if (debtReminders.length > 0) {
      const debtMessage = `💳 Debt Reminders:\n${debtReminders.join('\n')}`;
      await whatsApp.sendMessage(phoneNumber, debtMessage);
    }

    res.json({
      success: true,
      message: 'Summary shared via WhatsApp successfully',
      whatsappResult,
      shareUrl: summaryData.shareUrl,
      debtReminders: debtReminders.length
    });

  } catch (error) {
    console.error('WhatsApp sharing error:', error);
    res.status(500).json({
      error: 'Failed to share via WhatsApp',
      message: error.message
    });
  }
});

// GET /api/sharing/view/:userId - Public view of shared summary
router.get('/view/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { week } = req.query;

    // Generate a clean HTML view for sharing
    const summaryResponse = await fetch(`${req.protocol}://${req.get('host')}/api/sharing/weeklySummary/${userId}`);
    const summaryData = await summaryResponse.json();

    if (!summaryData.success) {
      return res.status(404).send('Summary not found');
    }

    const summary = summaryData.data;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>CashFlow Weekly Summary</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
            .card { background: white; border-radius: 10px; padding: 20px; margin: 10px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #2c3e50; }
            .amount { font-size: 24px; font-weight: bold; }
            .positive { color: #27ae60; }
            .negative { color: #e74c3c; }
            .category { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
            .insight { background: #3498db; color: white; padding: 10px; border-radius: 5px; margin: 5px 0; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h1>💰 CashFlow Weekly Summary</h1>
                <p>${summary.period.week}</p>
            </div>
        </div>
        
        <div class="card">
            <h2>📊 Overview</h2>
            <div class="category">
                <span>💸 Total Expenses:</span>
                <span class="amount negative">$${summary.totals.expenses.toFixed(2)}</span>
            </div>
            <div class="category">
                <span>💰 Total Income:</span>
                <span class="amount positive">$${summary.totals.income.toFixed(2)}</span>
            </div>
            <div class="category">
                <span>📈 Net Amount:</span>
                <span class="amount ${summary.totals.net >= 0 ? 'positive' : 'negative'}">$${summary.totals.net.toFixed(2)}</span>
            </div>
            <div class="category">
                <span>📱 Transactions:</span>
                <span>${summary.totals.transactionCount}</span>
            </div>
        </div>

        <div class="card">
            <h2>🎯 Insights</h2>
            <div class="insight">🏆 Top Category: ${summary.insights.topSpendingCategory}</div>
            <div class="insight">📅 Most Active Day: ${summary.insights.mostActiveDay}</div>
            <div class="insight">💵 Avg Daily Spending: $${summary.insights.avgDailySpending}</div>
            <div class="insight">💾 Savings Rate: ${summary.insights.savingsRate}%</div>
        </div>

        <div class="card">
            <h2>🏷️ Categories</h2>
            ${Object.entries(summary.categoryBreakdown).map(([category, data]) => `
                <div class="category">
                    <span>${category}</span>
                    <span>$${(data.expenses || 0).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>

        <div class="card" style="text-align: center; color: #7f8c8d;">
            <p>Generated by CashFlow 🚀</p>
            <p><small>Powered by voice-to-transaction AI</small></p>
        </div>
    </body>
    </html>`;

    res.send(html);

  } catch (error) {
    console.error('Share view error:', error);
    res.status(500).send('Error loading summary');
  }
});

// Helper function to format summary for WhatsApp
const formatSummaryForWhatsApp = (summary) => {
  const { totals, insights, period } = summary;
  
  return `💰 CashFlow Weekly Summary
${period.week}

📊 OVERVIEW
💸 Expenses: $${totals.expenses.toFixed(2)}
💰 Income: $${totals.income.toFixed(2)}
📈 Net: ${totals.net >= 0 ? '+' : ''}$${totals.net.toFixed(2)}
📱 Transactions: ${totals.transactionCount}

🎯 INSIGHTS
🏆 Top Category: ${insights.topSpendingCategory}
📅 Most Active: ${insights.mostActiveDay}
💵 Daily Avg: $${insights.avgDailySpending}
💾 Savings Rate: ${insights.savingsRate}%

${totals.net > 0 ? '🎉 Great job saving money!' : '💡 Consider tracking expenses more closely'}

Powered by CashFlow 🚀`;
};

// Helper function to generate debt reminders
const generateDebtReminders = (userId) => {
  // This would typically fetch from a debts database
  // For hackathon, we'll return sample reminders
  const sampleDebts = [
    "💳 Credit Card payment due in 3 days - $250",
    "🏠 Rent due next week - $1200",
    "📱 Phone bill due tomorrow - $45"
  ];
  
  // Return random debt reminders for demo
  return sampleDebts.slice(0, Math.floor(Math.random() * 3) + 1);
};

module.exports = router;
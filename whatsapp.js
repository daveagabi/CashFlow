// WhatsApp Integration for CashFlow
const axios = require('axios');

class WhatsAppIntegration {
  constructor() {
    this.accessToken = process.env.WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}`;
  }

  // Send a WhatsApp message
  async sendMessage(to, message) {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        console.log('⚠️ WhatsApp credentials not configured');
        return null;
      }

      const messageData = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      };

      console.log('📤 Sending WhatsApp message...');

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ WhatsApp message sent:', response.data.messages[0].id);
      return response.data;

    } catch (error) {
      console.error('❌ WhatsApp send error:', error.message);
      return null;
    }
  }

  // Send spending alert via WhatsApp
  async sendSpendingAlert(phoneNumber, transactionData) {
    const message = `🚨 CashFlow Alert!
    
💰 New expense recorded: $${transactionData.amount}
📝 Description: ${transactionData.description}
🏷️ Category: ${transactionData.category}
⏰ Time: ${new Date(transactionData.createdAt).toLocaleString()}

${transactionData.amount > 100 ? '⚠️ This is a large expense!' : '✅ Expense logged successfully'}

Reply STOP to unsubscribe from alerts.`;

    return await this.sendMessage(phoneNumber, message);
  }

  // Send daily spending summary
  async sendDailySummary(phoneNumber, summaryData) {
    const message = `📊 Daily CashFlow Summary

💸 Today's Expenses: $${summaryData.totalExpenses || 0}
💰 Today's Income: $${summaryData.totalIncome || 0}
📈 Net: $${(summaryData.totalIncome || 0) - (summaryData.totalExpenses || 0)}

🏆 Top Category: ${summaryData.topCategory || 'None'}
📱 Total Transactions: ${summaryData.transactionCount || 0}

Keep tracking your expenses! 💪`;

    return await this.sendMessage(phoneNumber, message);
  }

  // Send budget warning
  async sendBudgetWarning(phoneNumber, budgetData) {
    const percentage = Math.round((budgetData.spent / budgetData.budget) * 100);
    
    const message = `⚠️ Budget Alert!

You've spent ${percentage}% of your ${budgetData.category} budget this month.

💰 Budget: $${budgetData.budget}
💸 Spent: $${budgetData.spent}
💵 Remaining: $${budgetData.budget - budgetData.spent}

${percentage > 90 ? '🚨 Consider reducing spending in this category!' : '📊 Keep an eye on your spending!'}`;

    return await this.sendMessage(phoneNumber, message);
  }

  // Send welcome message
  async sendWelcomeMessage(phoneNumber, userName) {
    const message = `👋 Welcome to CashFlow, ${userName}!

🎯 Your personal finance assistant is ready!

Features:
💰 Voice expense tracking
📊 Spending summaries  
🚨 Budget alerts
📈 Financial insights

Start by saying "I spent $20 on lunch" and we'll track it for you!

Reply HELP for more commands.`;

    return await this.sendMessage(phoneNumber, message);
  }

  // Process incoming WhatsApp messages (webhook handler)
  processIncomingMessage(webhookData) {
    try {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (value?.messages) {
        const message = value.messages[0];
        const from = message.from;
        const messageBody = message.text?.body;
        const messageType = message.type;

        console.log('📱 Received WhatsApp message:', {
          from,
          type: messageType,
          body: messageBody
        });

        return {
          from,
          message: messageBody,
          type: messageType,
          timestamp: message.timestamp
        };
      }

      return null;
    } catch (error) {
      console.error('❌ WhatsApp webhook processing error:', error.message);
      return null;
    }
  }

  // Parse expense from natural language message
  parseExpenseMessage(message) {
    try {
      // Simple regex patterns to extract expense info
      const amountPattern = /\$?(\d+(?:\.\d{2})?)/;
      const spentPattern = /spent|paid|bought|cost/i;
      
      if (!spentPattern.test(message)) {
        return null;
      }

      const amountMatch = message.match(amountPattern);
      if (!amountMatch) {
        return null;
      }

      const amount = parseFloat(amountMatch[1]);
      
      // Extract description (everything after amount or spending verb)
      let description = message.replace(amountPattern, '').replace(/spent|paid|bought|cost/gi, '').trim();
      description = description.replace(/on|for/gi, '').trim();
      
      // Determine category based on keywords
      const categories = {
        food: ['lunch', 'dinner', 'breakfast', 'coffee', 'restaurant', 'food', 'eat'],
        transport: ['uber', 'taxi', 'bus', 'train', 'gas', 'fuel', 'parking'],
        shopping: ['clothes', 'shoes', 'shopping', 'store', 'buy', 'purchase'],
        entertainment: ['movie', 'cinema', 'game', 'concert', 'show', 'fun'],
        health: ['doctor', 'medicine', 'pharmacy', 'hospital', 'health']
      };

      let category = 'other';
      for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
          category = cat;
          break;
        }
      }

      return {
        amount,
        description: description || 'WhatsApp expense',
        category,
        type: 'expense',
        voiceData: `WhatsApp: ${message}`
      };

    } catch (error) {
      console.error('❌ Message parsing error:', error.message);
      return null;
    }
  }

  // Test WhatsApp connection
  async testConnection() {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        return {
          success: false,
          message: 'WhatsApp credentials not configured in environment variables'
        };
      }

      // Test by getting phone number info
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return {
        success: true,
        message: 'WhatsApp connection successful',
        phoneNumberId: this.phoneNumberId,
        displayName: response.data.display_phone_number
      };

    } catch (error) {
      return {
        success: false,
        message: `WhatsApp connection failed: ${error.message}`
      };
    }
  }
}

module.exports = WhatsAppIntegration;
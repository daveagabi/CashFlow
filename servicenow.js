// ServiceNow Integration for CashFlow
const axios = require('axios');

class ServiceNowIntegration {
  constructor() {
    this.instanceUrl = process.env.SERVICENOW_INSTANCE_URL;
    this.username = process.env.SERVICENOW_USERNAME;
    this.password = process.env.SERVICENOW_PASSWORD;
    this.baseUrl = `${this.instanceUrl}/api/now/table`;
  }

  // Create authentication headers
  getAuthHeaders() {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Create a ServiceNow incident for unusual spending
  async createSpendingAlert(transactionData) {
    try {
      if (!this.instanceUrl || !this.username || !this.password) {
        console.log('⚠️ ServiceNow credentials not configured');
        return null;
      }

      const incidentData = {
        short_description: `Unusual spending detected: ${transactionData.description}`,
        description: `
          Transaction Details:
          - Amount: $${transactionData.amount}
          - Category: ${transactionData.category}
          - User: ${transactionData.userId}
          - Date: ${transactionData.createdAt}
          - Voice Input: ${transactionData.voiceData || 'N/A'}
        `,
        category: 'Financial Alert',
        subcategory: 'Spending Anomaly',
        priority: transactionData.amount > 500 ? '2' : '3', // High priority for large amounts
        state: '1', // New
        caller_id: transactionData.userId
      };

      console.log('📤 Creating ServiceNow incident...');
      
      const response = await axios.post(
        `${this.baseUrl}/incident`,
        incidentData,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ ServiceNow incident created:', response.data.result.number);
      return response.data.result;

    } catch (error) {
      console.error('❌ ServiceNow integration error:', error.message);
      return null;
    }
  }

  // Create a knowledge base article for spending tips
  async createSpendingTip(category, tip) {
    try {
      if (!this.instanceUrl) {
        console.log('⚠️ ServiceNow not configured');
        return null;
      }

      const kbData = {
        short_description: `Money Saving Tip: ${category}`,
        text: tip,
        category: 'Financial Advice',
        subcategory: category,
        workflow_state: 'published'
      };

      const response = await axios.post(
        `${this.baseUrl}/kb_knowledge`,
        kbData,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ Knowledge article created:', response.data.result.number);
      return response.data.result;

    } catch (error) {
      console.error('❌ ServiceNow KB creation error:', error.message);
      return null;
    }
  }

  // Get spending insights from ServiceNow
  async getSpendingInsights(userId) {
    try {
      if (!this.instanceUrl) {
        return { insights: [], recommendations: [] };
      }

      // Query incidents related to this user
      const response = await axios.get(
        `${this.baseUrl}/incident?sysparm_query=caller_id=${userId}^category=Financial Alert`,
        { headers: this.getAuthHeaders() }
      );

      const incidents = response.data.result || [];
      
      return {
        totalAlerts: incidents.length,
        recentAlerts: incidents.slice(0, 5),
        recommendations: this.generateRecommendations(incidents)
      };

    } catch (error) {
      console.error('❌ ServiceNow insights error:', error.message);
      return { insights: [], recommendations: [] };
    }
  }

  // Generate spending recommendations
  generateRecommendations(incidents) {
    const recommendations = [];
    
    if (incidents.length > 5) {
      recommendations.push('Consider setting up spending alerts for amounts over $100');
    }
    
    if (incidents.length > 10) {
      recommendations.push('Review your monthly budget - you have many spending alerts');
    }

    recommendations.push('Track your expenses daily to avoid overspending');
    
    return recommendations;
  }

  // Log sync summary to ServiceNow u_cashflow_logs table
  async logSyncSummary(summaryData) {
    try {
      if (!this.instanceUrl || !this.username || !this.password) {
        console.log('⚠️ ServiceNow credentials not configured');
        return null;
      }

      const logData = {
        u_user_id: summaryData.userId,
        u_sync_timestamp: summaryData.syncTimestamp,
        u_transaction_count: summaryData.transactionCount.toString(),
        u_total_amount: summaryData.totalAmount.toString(),
        u_expense_count: summaryData.expenseCount.toString(),
        u_income_count: summaryData.incomeCount.toString(),
        u_top_category: summaryData.topCategory,
        u_category_breakdown: JSON.stringify(summaryData.categoryBreakdown),
        u_source: summaryData.source,
        u_status: 'synced',
        short_description: `CashFlow sync: ${summaryData.transactionCount} transactions for ${summaryData.userId}`,
        description: `
          Sync Summary:
          - User: ${summaryData.userId}
          - Transactions: ${summaryData.transactionCount}
          - Total Amount: $${summaryData.totalAmount}
          - Expenses: ${summaryData.expenseCount}
          - Income: ${summaryData.incomeCount}
          - Top Category: ${summaryData.topCategory}
          - Timestamp: ${summaryData.syncTimestamp}
        `
      };

      console.log('📤 Logging to ServiceNow u_cashflow_logs...');
      
      const response = await axios.post(
        `${this.baseUrl}/u_cashflow_logs`,
        logData,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ ServiceNow log created:', response.data.result.sys_id);
      return response.data.result;

    } catch (error) {
      console.error('❌ ServiceNow logging error:', error.message);
      throw error; // Re-throw to trigger retry logic
    }
  }

  // Get sync logs from ServiceNow
  async getSyncLogs(userId, limit = 10) {
    try {
      if (!this.instanceUrl) {
        return { logs: [], total: 0 };
      }

      const query = userId ? `u_user_id=${userId}` : '';
      const response = await axios.get(
        `${this.baseUrl}/u_cashflow_logs?sysparm_query=${query}&sysparm_orderby=u_sync_timestamp&sysparm_limit=${limit}`,
        { headers: this.getAuthHeaders() }
      );

      const logs = response.data.result || [];
      
      return {
        logs: logs.map(log => ({
          id: log.sys_id,
          userId: log.u_user_id,
          syncTimestamp: log.u_sync_timestamp,
          transactionCount: parseInt(log.u_transaction_count || '0'),
          totalAmount: parseFloat(log.u_total_amount || '0'),
          topCategory: log.u_top_category,
          status: log.u_status,
          createdAt: log.sys_created_on
        })),
        total: logs.length
      };

    } catch (error) {
      console.error('❌ ServiceNow get logs error:', error.message);
      return { logs: [], total: 0 };
    }
  }

  // Test ServiceNow connection
  async testConnection() {
    try {
      if (!this.instanceUrl || !this.username || !this.password) {
        return {
          success: false,
          message: 'ServiceNow credentials not configured in environment variables'
        };
      }

      // Test both incident and u_cashflow_logs tables
      const incidentResponse = await axios.get(
        `${this.baseUrl}/incident?sysparm_limit=1`,
        { headers: this.getAuthHeaders() }
      );

      const logsResponse = await axios.get(
        `${this.baseUrl}/u_cashflow_logs?sysparm_limit=1`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        message: 'ServiceNow connection successful',
        instanceUrl: this.instanceUrl,
        tablesAccessible: {
          incident: true,
          u_cashflow_logs: true
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `ServiceNow connection failed: ${error.message}`
      };
    }
  }
}

module.exports = ServiceNowIntegration;
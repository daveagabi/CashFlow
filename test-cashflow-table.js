// Test the actual CashFlow table
const axios = require('axios');

const auth = {
  username: 'admin',
  password: '7WXg$8eQoo@W'
};

const tableName = 'x_1851157_cashflow_cashflow_logs';
const baseUrl = 'https://dev192269.service-now.com/api/now/table';

async function testCashFlowTable() {
  try {
    console.log('🧪 Testing CashFlow table:', tableName);
    
    // Test 1: GET request (check if table exists and is accessible)
    console.log('\n1️⃣ Testing GET request...');
    const getResponse = await axios.get(
      `${baseUrl}/${tableName}?sysparm_limit=1`,
      { auth }
    );
    console.log('✅ GET successful! Status:', getResponse.status);
    console.log('   Records found:', getResponse.data.result.length);
    
    // Test 2: POST request (create a record)
    console.log('\n2️⃣ Testing POST request...');
    const testData = {
      u_business: 'Test Trader',
      u_date: '2025-10-24',
      u_income: 50000,
      u_expense: 20000,
      u_profit: 30000,
      u_debts: '[{"name":"John","amount":5000}]',
      u_synced: true
    };
    
    const postResponse = await axios.post(
      `${baseUrl}/${tableName}`,
      testData,
      { auth }
    );
    
    console.log('✅ POST successful! Status:', postResponse.status);
    console.log('   Created record sys_id:', postResponse.data.result.sys_id);
    
    // Test 3: GET the created record
    console.log('\n3️⃣ Verifying created record...');
    const verifyResponse = await axios.get(
      `${baseUrl}/${tableName}?sysparm_query=sys_id=${postResponse.data.result.sys_id}`,
      { auth }
    );
    
    console.log('✅ Verification successful!');
    console.log('   Business:', verifyResponse.data.result[0].u_business);
    console.log('   Income:', verifyResponse.data.result[0].u_income);
    console.log('   Profit:', verifyResponse.data.result[0].u_profit);
    
    console.log('\n🎉 All CashFlow table tests passed!');
    console.log('🚀 ServiceNow integration is ready for your team!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Table not found. Make sure the table name is correct:');
      console.log('   Expected: x_1851157_cashflow_cashflow_logs');
    }
  }
}

testCashFlowTable();
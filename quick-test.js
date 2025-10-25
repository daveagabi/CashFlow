// Quick ServiceNow connection test
const axios = require('axios');

const auth = {
  username: 'admin',
  password: '7WXg$8eQoo@W'
};

async function testConnection() {
  try {
    console.log('Testing ServiceNow connection...');
    
    // Test incident table (should always exist)
    const response = await axios.get(
      'https://dev192269.service-now.com/api/now/table/incident?sysparm_limit=1',
      { auth }
    );
    
    console.log('✅ ServiceNow connection successful!');
    console.log('Status:', response.status);
    console.log('Records found:', response.data.result.length);
    
    // Test creating a record
    const createResponse = await axios.post(
      'https://dev192269.service-now.com/api/now/table/incident',
      {
        short_description: 'CashFlow API Test',
        description: 'Testing API connection from CashFlow app'
      },
      { auth }
    );
    
    console.log('✅ Record creation successful!');
    console.log('Created incident:', createResponse.data.result.number);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.response?.data || error.message);
  }
}

testConnection();
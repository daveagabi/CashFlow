// CashFlow API Testing Tool
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BASE_URL = 'http://localhost:3000';

// Test functions
const testHealthCheck = async () => {
  try {
    console.log('🏥 Testing Health Check...');
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check Result:', data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
};

const testCreateTransaction = async () => {
  try {
    console.log('💰 Testing Transaction Creation...');
    
    const transactionData = {
      amount: Math.floor(Math.random() * 100) + 10, // Random amount 10-110
      description: "Test transaction from API tester",
      category: "testing",
      type: "expense",
      userId: "test-user-" + Date.now(),
      voiceData: "User said: I spent money on testing"
    };

    console.log('📤 Sending:', transactionData);

    const response = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData)
    });

    const result = await response.json();
    console.log('✅ Transaction Result:', result);
    
    if (result.success) {
      console.log('🎉 Transaction created with ID:', result.data.id);
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('❌ Transaction Creation Failed:', error.message);
    return null;
  }
};

const testGetTransactions = async (userId) => {
  try {
    console.log('📋 Testing Get Transactions...');
    const response = await fetch(`${BASE_URL}/api/transactions?userId=${userId}&limit=5`);
    const result = await response.json();
    console.log('✅ Transactions Result:', result);
    return result;
  } catch (error) {
    console.error('❌ Get Transactions Failed:', error.message);
    return null;
  }
};

const testGetSummary = async (userId) => {
  try {
    console.log('📊 Testing Summary...');
    const response = await fetch(`${BASE_URL}/api/summary?userId=${userId}&period=month`);
    const result = await response.json();
    console.log('✅ Summary Result:', result);
    return result;
  } catch (error) {
    console.error('❌ Summary Failed:', error.message);
    return null;
  }
};

const testIntegrations = async () => {
  try {
    console.log('🔌 Testing Integrations...');
    const response = await fetch(`${BASE_URL}/api/integrations/test`);
    const result = await response.json();
    console.log('✅ Integration Test Results:', result);
    return result;
  } catch (error) {
    console.error('❌ Integration Test Failed:', error.message);
    return null;
  }
};

const testWhatsAppMessage = async () => {
  try {
    console.log('📱 Testing WhatsApp Message...');
    
    const messageData = {
      phoneNumber: "+1234567890", // Replace with test number
      message: "🧪 Test message from CashFlow API! Your backend is working perfectly! 🎉"
    };

    const response = await fetch(`${BASE_URL}/api/integrations/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });

    const result = await response.json();
    console.log('✅ WhatsApp Test Result:', result);
    return result;
  } catch (error) {
    console.error('❌ WhatsApp Test Failed:', error.message);
    return null;
  }
};

// Interactive menu
const showMenu = () => {
  console.log('\n🧪 CashFlow API Tester');
  console.log('======================');
  console.log('1. Test Health Check');
  console.log('2. Create Test Transaction');
  console.log('3. Get Transactions (need userId)');
  console.log('4. Get Summary (need userId)');
  console.log('5. Test Integrations (ServiceNow & WhatsApp)');
  console.log('6. Test WhatsApp Message');
  console.log('7. Run All Tests');
  console.log('8. Exit');
  console.log('======================');
};

const handleChoice = async (choice) => {
  switch (choice) {
    case '1':
      await testHealthCheck();
      break;
    case '2':
      const transaction = await testCreateTransaction();
      if (transaction) {
        console.log(`💡 Use userId "${transaction.userId}" for other tests`);
      }
      break;
    case '3':
      rl.question('Enter userId: ', async (userId) => {
        await testGetTransactions(userId);
        showMenu();
        rl.prompt();
      });
      return;
    case '4':
      rl.question('Enter userId: ', async (userId) => {
        await testGetSummary(userId);
        showMenu();
        rl.prompt();
      });
      return;
    case '5':
      await testIntegrations();
      break;
    case '6':
      await testWhatsAppMessage();
      break;
    case '7':
      console.log('🚀 Running all tests...');
      await testHealthCheck();
      const testTransaction = await testCreateTransaction();
      if (testTransaction) {
        await testGetTransactions(testTransaction.userId);
        await testGetSummary(testTransaction.userId);
      }
      await testIntegrations();
      break;
    case '8':
      console.log('👋 Goodbye!');
      rl.close();
      return;
    default:
      console.log('❌ Invalid choice');
  }
  
  showMenu();
  rl.prompt();
};

// Start the tester
console.log('🔥 CashFlow API Tester Started');
console.log('Make sure your server is running on http://localhost:3000');

showMenu();
rl.prompt();

rl.on('line', (input) => {
  handleChoice(input.trim());
});

rl.on('close', () => {
  process.exit(0);
});
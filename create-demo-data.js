// Create Demo Transactions for CashFlow Hackathon
const createDemoTransactions = async () => {
  const BASE_URL = 'http://localhost:3000';
  const demoUserId = 'hackathon-demo-user';
  
  console.log('🎬 Creating demo transactions for weekly summary...');
  
  const demoTransactions = [
    { voiceText: 'I spent forty-five dollars on lunch at McDonald''s', userId: demoUserId },
    { voiceText: 'Received two thousand five hundred dollars salary payment', userId: demoUserId },
    { voiceText: 'Paid one hundred twenty dollars for groceries at Walmart', userId: demoUserId },
    { voiceText: 'Bought coffee for four dollars fifty this morning', userId: demoUserId },
    { voiceText: 'Mama Ngozi paid me back twelve thousand naira she owed', userId: demoUserId },
    { voiceText: 'Spent eighty-five dollars on gas for my car', userId: demoUserId },
    { voiceText: 'Received five hundred dollars freelance payment', userId: demoUserId }
  ];
  
  for (const transaction of demoTransactions) {
    try {
      const response = await fetch(${BASE_URL}/api/voice/parse-and-save, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      
      const result = await response.json();
      if (result.success) {
        console.log(✅ Created: backend{result.data.amount} - );
      } else {
        console.log(❌ Failed: );
      }
    } catch (error) {
      console.log(❌ Error: );
    }
  }
  
  console.log('🎯 Demo transactions created! Test with:');
  console.log(curl "http://localhost:3000/api/sharing/weeklySummary/");
};

createDemoTransactions();

// ai/demo.js - Quick testing interface
const { AIClient } = require('./aiClient');
const { runTests } = require('./test_suite');

async function interactiveDemo() {
  console.log('🎤 VOICE-TO-TRANSACTION PARSER DEMO\n');
  
  const client = new AIClient('regex'); // Start with regex while Ollama downloads
  
  // Test the regex parser immediately
  console.log('1. Testing Regex Parser...');
  runTests();
  
  console.log('\n2. Interactive Testing:');
  console.log('   Try phrases like: "Sold 3 bags of rice for 15k cash"');
  console.log('   Type "quit" to exit\n');
  
  // Simple interactive mode (you can enhance this)
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function ask() {
    readline.question('💬 Enter transaction: ', async (input) => {
      if (input.toLowerCase() === 'quit') {
        readline.close();
        return;
      }
      
      const result = await client.parseTranscript(input);
      console.log('📊 Result:', JSON.stringify(result, null, 2));
      console.log('');
      ask();
    });
  }
  
  ask();
}

// Run demo
if (require.main === module) {
  interactiveDemo();
}

module.exports = { interactiveDemo };
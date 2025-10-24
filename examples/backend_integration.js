// examples/backend_integration.js - How to use in backend
const { parseTransaction, getStats } = require('../ai');

// Example 1: Simple usage
async function logTransaction(voiceTranscript) {
    const result = await parseTransaction(voiceTranscript);
    
    if (result.success) {
        console.log('✅ Transaction parsed successfully:');
        console.log('   Type:', result.data.type);
        console.log('   Amount:', result.data.amount);
        console.log('   Confidence:', result.confidence);
        
        // Save to database
        return await saveToDatabase(result.data);
    } else {
        console.log('❌ Failed to parse transaction:', result.error);
        return null;
    }
}

// Example 2: Batch processing
async function processMultipleTransactions(transcripts) {
    const results = [];
    
    for (const transcript of transcripts) {
        const result = await parseTransaction(transcript);
        results.push({
            transcript,
            parsed: result
        });
        
        // Small delay to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
}

// Example 3: Get service stats
function monitorAIService() {
    const stats = getStats();
    console.log('📊 AI Service Statistics:');
    console.log('   Total Requests:', stats.totalRequests);
    console.log('   Success Rate:', stats.successRate + '%');
    console.log('   Average Confidence:', stats.averageConfidence + '%');
}

// Mock database function
async function saveToDatabase(transactionData) {
    // This would connect to your actual database
    console.log('💾 Saving to database:', transactionData);
    return { id: '123', ...transactionData };
}

// Test the examples
async function testIntegration() {
    console.log('🧪 TESTING BACKEND INTEGRATION\n');
    
    // Test single transaction
    await logTransaction("Sold 3 bags of rice for 15k cash");
    
    // Test multiple transactions
    const transcripts = [
        "I collect 5k from Ngozi",
        "Bought stock for 10k",
        "Mama Ngozi owes me 12k"
    ];
    
    const batchResults = await processMultipleTransactions(transcripts);
    console.log('\n📦 Batch Results:', batchResults.length, 'transactions processed');
    
    // Show stats
    monitorAIService();
}

if (require.main === module) {
    testIntegration();
}

module.exports = { logTransaction, processMultipleTransactions, monitorAIService };
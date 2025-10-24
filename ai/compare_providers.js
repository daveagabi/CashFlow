// ai/compare_providers.js - Compare accuracy between providers
require('dotenv').config();
const { AIClient } = require('./aiClient');

// Test cases (copy from your enhanced_tests.js or use these)
const testCases = [
    { input: "Sold 3 bags of rice for 15k cash", expected: { type: 'income', item: 'rice', quantity: 3, amount: 15000, method: 'cash' }},
    { input: "Bought stock for 10k from Iya Biliki", expected: { type: 'expense', item: 'stock', amount: 10000, person: 'Iya Biliki' }},
    { input: "Mama Ngozi owes me 12k", expected: { type: 'debt', amount: 12000, person: 'Mama Ngozi' }},
    { input: "I collect 5k from Ngozi", expected: { type: 'income', amount: 5000, person: 'Ngozi' }},
    { input: "I buy market for 8k", expected: { type: 'expense', amount: 8000 }},
    { input: "Na him owe me 7k", expected: { type: 'debt', amount: 7000 }},
    { input: "Sold bag of rice 13k", expected: { type: 'income', item: 'rice', amount: 13000 }},
    { input: "Took 2k as change", expected: { type: 'income', amount: 2000, item: 'change' }},
];

async function compareProviders() {
    console.log('🔬 COMPARING AI PROVIDERS\n');
    
    const providers = ['regex', 'huggingface'];
    const results = {};
    
    for (const provider of providers) {
        console.log(`\n🧪 Testing ${provider.toUpperCase()}...`);
        const client = new AIClient(provider);
        let passed = 0;
        let totalTime = 0;
        const details = [];
        
        for (const test of testCases) {
            try {
                const startTime = Date.now();
                const result = await client.parseTranscript(test.input);
                const endTime = Date.now();
                
                const isPass = compareResults(result, test.expected);
                const time = endTime - startTime;
                
                if (isPass) passed++;
                totalTime += time;
                
                details.push({
                    input: test.input,
                    passed: isPass,
                    time: time,
                    result: result
                });
                
                console.log(`   ${isPass ? '✅' : '❌'} "${test.input}"`);
                
                // Add delay for Hugging Face to avoid rate limiting
                if (provider === 'huggingface') {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (error) {
                console.log(`   💥 Error: "${test.input}" - ${error.message}`);
                details.push({
                    input: test.input,
                    passed: false,
                    error: error.message
                });
            }
        }
        
        results[provider] = {
            accuracy: (passed / testCases.length) * 100,
            averageTime: totalTime / testCases.length,
            passed,
            total: testCases.length,
            details
        };
        
        console.log(`   📊 ${passed}/${testCases.length} passed (${results[provider].accuracy.toFixed(1)}%)`);
        console.log(`   ⏱️  Average time: ${results[provider].averageTime.toFixed(0)}ms`);
    }
    
    // Display comparison
    console.log('\n📊 PROVIDER COMPARISON RESULTS');
    console.log('==============================');
    
    providers.forEach(provider => {
        const result = results[provider];
        console.log(`\n${provider.toUpperCase()}:`);
        console.log(`   Accuracy: ${result.accuracy.toFixed(1)}%`);
        console.log(`   Speed: ${result.averageTime.toFixed(0)}ms average`);
        console.log(`   Reliability: ${result.passed}/${result.total} tests`);
    });
    
    // Recommendation
    console.log('\n💡 RECOMMENDATION:');
    const regexAccuracy = results.regex.accuracy;
    const hfAccuracy = results.huggingface.accuracy;
    
    if (regexAccuracy >= 80 && results.regex.averageTime < 100) {
        console.log('   ✅ Use REGEX as primary (fast & accurate)');
        console.log('   🔄 Use Hugging Face as fallback for complex cases');
    } else if (hfAccuracy > regexAccuracy + 10) {
        console.log('   ✅ Use HUGGING FACE as primary (better accuracy)');
        console.log('   ⚠️  Add loading states for slower responses');
    } else {
        console.log('   ✅ Use REGEX (good balance of speed & accuracy)');
    }
    
    return results;
}

function compareResults(actual, expected) {
    for (const key in expected) {
        if (actual[key] !== expected[key]) {
            return false;
        }
    }
    return true;
}

// Run if called directly
if (require.main === module) {
    compareProviders();
}

module.exports = { compareProviders, testCases };
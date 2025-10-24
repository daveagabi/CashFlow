// ai/enhanced_tests.js - Comprehensive testing
const { AIClient } = require('./aiClient');

const comprehensiveTestCases = [
    // Basic transactions
    { input: "Sold 3 bags of rice for 15k cash", expected: { type: 'income', item: 'rice', quantity: 3, amount: 15000, method: 'cash' }},
    { input: "Bought stock for 10k from Iya Biliki", expected: { type: 'expense', item: 'stock', amount: 10000, person: 'Iya Biliki' }},
    { input: "Mama Ngozi owes me 12k", expected: { type: 'debt', amount: 12000, person: 'Mama Ngozi' }},
    
    // Nigerian Pidgin/English variations
    { input: "I collect 5k from Ngozi", expected: { type: 'income', amount: 5000, person: 'Ngozi' }},
    { input: "I buy market for 8k", expected: { type: 'expense', amount: 8000 }},
    { input: "Na him owe me 7k", expected: { type: 'debt', amount: 7000 }},
    { input: "I sell bag of rice 13k", expected: { type: 'income', item: 'rice', amount: 13000 }},
    { input: "Make I buy beans 2k", expected: { type: 'expense', item: 'beans', amount: 2000 }},
    
    // Amount formats
    { input: "Took 2k as change", expected: { type: 'income', amount: 2000, item: 'change' }},
    { input: "Paid 15,000 for generator", expected: { type: 'expense', amount: 15000 }},
    { input: "Received 25k transfer from Tunde", expected: { type: 'income', amount: 25000, method: 'transfer', person: 'Tunde' }},
    { input: "Give me 3 thousand naira", expected: { type: 'income', amount: 3000 }},
    { input: "Spent 5 grand on fuel", expected: { type: 'expense', amount: 5000 }},
    
    // Edge cases
    { input: "Sold rice 10k", expected: { type: 'income', item: 'rice', amount: 10000 }},
    { input: "Bought 2 bags", expected: { type: 'expense', quantity: 2 }},
    { input: "Owe me money", expected: { type: 'debt' }},
];

async function runComprehensiveTests() {
    const client = new AIClient('regex'); // Using regex while Ollama downloads
    let passed = 0;
    let failed = 0;
    const details = [];

    console.log('🧪 COMPREHENSIVE PARSER TESTS\n');
    console.log('Using provider:', client.getProviderInfo().provider, '\n');

    for (const test of comprehensiveTestCases) {
        try {
            const result = await client.parseTranscript(test.input);
            const isPass = compareResults(result, test.expected);
            
            details.push({
                input: test.input,
                expected: test.expected,
                actual: result,
                passed: isPass
            });

            console.log(`${isPass ? '✅' : '❌'} "${test.input}"`);
            
            if (!isPass) {
                console.log(`   Expected: ${JSON.stringify(test.expected)}`);
                console.log(`   Got:      ${JSON.stringify({
                    type: result.type,
                    item: result.item,
                    quantity: result.quantity,
                    amount: result.amount,
                    method: result.method,
                    person: result.person
                })}`);
                console.log(`   Confidence: ${result.confidence}, Source: ${result.source}\n`);
            }
            
            isPass ? passed++ : failed++;
            
        } catch (error) {
            console.log(`💥 ERROR: "${test.input}" - ${error.message}`);
            failed++;
        }
    }

    // Summary
    console.log('\n📊 COMPREHENSIVE RESULTS');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Accuracy: ${((passed / comprehensiveTestCases.length) * 100).toFixed(1)}%`);
    
    return { passed, failed, total: comprehensiveTestCases.length, details };
}

function compareResults(actual, expected) {
    for (const key in expected) {
        if (actual[key] !== expected[key]) {
            return false;
        }
    }
    return true;
}

// Export for use in other files
module.exports = { comprehensiveTestCases, runComprehensiveTests };

// Run if called directly
if (require.main === module) {
    runComprehensiveTests();
}
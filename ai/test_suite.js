// ai/test_suite.js - UPDATE THESE LINES
const TransactionParser = require('./parser.js');  // Remove the { }

const testCases = [
    { input: "Sold 3 bags of rice for 15k cash", expected: { type: 'income', item: 'rice', quantity: 3, amount: 15000, method: 'cash' }},
    { input: "Bought stock for 10k from Iya Biliki", expected: { type: 'expense', item: 'stock', amount: 10000, person: 'Iya Biliki' }},
    { input: "Mama Ngozi owes me 12k", expected: { type: 'debt', amount: 12000, person: 'Mama Ngozi' }},
    { input: "I collect 5k from Ngozi", expected: { type: 'income', amount: 5000, person: 'Ngozi' }},
    { input: "I buy market for 8k", expected: { type: 'expense', amount: 8000 }},
];

function runTests() {
    const parser = new TransactionParser();  // This should work now
    let passed = 0;
    let failed = 0;

    console.log('🧪 RUNNING REGEX PARSER TESTS...\n');

    testCases.forEach((test, index) => {
        const result = parser.parse(test.input);
        const isPass = compareResults(result, test.expected);
        
        console.log(`${isPass ? '✅' : '❌'} Test ${index + 1}: "${test.input}"`);
        console.log(`   Expected: ${JSON.stringify(test.expected)}`);
        console.log(`   Got:      ${JSON.stringify({
            type: result.type,
            item: result.item,
            quantity: result.quantity,
            amount: result.amount,
            method: result.method,
            person: result.person
        })}`);
        console.log(`   Confidence: ${result.confidence}\n`);
        
        isPass ? passed++ : failed++;
    });

    console.log(`📊 RESULTS: ${passed}/${testCases.length} passed (${((passed/testCases.length)*100).toFixed(1)}%)`);
    return { passed, failed, total: testCases.length };
}

function compareResults(actual, expected) {
    for (const key in expected) {
        if (actual[key] !== expected[key]) {
            return false;
        }
    }
    return true;
}

module.exports = { testCases, runTests };

if (require.main === module) {
    runTests();
}
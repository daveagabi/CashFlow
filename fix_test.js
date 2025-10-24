// fix_test.js - SIMPLE VERSION THAT WORKS
console.log("🔧 Testing parser setup...");

try {
    // Import the class directly
    const TransactionParser = require('./ai/parser');
    console.log("✅ Parser module loaded successfully");
    
    // Create instance
    const parser = new TransactionParser();
    console.log("✅ Parser instance created successfully");
    
    // Test the parse method
    const result = parser.parse("Sold 3 bags of rice for 15k cash");
    console.log("✅ Parse method works!");
    console.log("Result:", JSON.stringify(result, null, 2));
    
} catch (error) {
    console.log("❌ Error:", error.message);
    console.log("Let's check what's actually exported...");
    
    // Debug what's actually being exported
    try {
        const exported = require('./ai/parser');
        console.log("Exported value type:", typeof exported);
        console.log("Exported value:", exported);
        if (typeof exported === 'object') {
            console.log("Object keys:", Object.keys(exported));
        }
    } catch (e) {
        console.log("Couldn't even require the module:", e.message);
    }
}
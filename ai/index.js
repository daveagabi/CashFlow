// ai/index.js - Simple entry point for backend
const { aiService, parseTransaction } = require('./final_service');

// Export simple API
module.exports = {
    parseTransaction,
    getAIService: () => aiService,
    getStats: () => aiService.getStats(),
    
    // Simple test function
    test: async (transcript) => {
        const result = await parseTransaction(transcript);
        return {
            input: transcript,
            output: result
        };
    }
};
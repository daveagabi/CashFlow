// ai/api.js - Backend-ready API
require('dotenv').config();
const { AIOrchestrator } = require('./orchestrator');

class AIService {
    constructor() {
        this.orchestrator = new AIOrchestrator();
        this.stats = {
            totalRequests: 0,
            regexUsed: 0,
            aiUsed: 0,
            aiFailed: 0
        };
    }
    
    async parseTransaction(transcript) {
        this.stats.totalRequests++;
        
        try {
            const result = await this.orchestrator.parseTranscript(transcript);
            
            // Track usage
            if (result.source.includes('regex')) this.stats.regexUsed++;
            if (result.source.includes('huggingface')) this.stats.aiUsed++;
            if (result.source.includes('fallback')) this.stats.aiFailed++;
            
            return {
                success: true,
                data: result,
                processingTime: result.processingTime || 0,
                source: result.source
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }
    
    getStats() {
        return {
            ...this.stats,
            aiSuccessRate: this.stats.aiUsed > 0 ? 
                ((this.stats.aiUsed - this.stats.aiFailed) / this.stats.aiUsed * 100).toFixed(1) : 0
        };
    }
    
    resetStats() {
        this.stats = {
            totalRequests: 0,
            regexUsed: 0,
            aiUsed: 0,
            aiFailed: 0
        };
    }
}

// Singleton instance for the app
const aiService = new AIService();

// Export for backend use
module.exports = { aiService, AIService };

// Simple test if run directly
if (require.main === module) {
    console.log('🧪 Testing AI Service...');
    
    const testTranscripts = [
        "Sold 3 bags of rice for 15k cash",
        "I collect 5k from Ngozi",
        "Bought stock for 10k"
    ];
    
    async function testService() {
        for (const transcript of testTranscripts) {
            const result = await aiService.parseTransaction(transcript);
            console.log(`\n📝 "${transcript}"`);
            console.log(`   Success: ${result.success}`);
            console.log(`   Source: ${result.source}`);
            if (result.success) {
                console.log(`   Type: ${result.data.type}, Amount: ${result.data.amount}`);
            }
        }
        
        console.log('\n📊 Service Stats:', aiService.getStats());
    }
    
    testService();
}
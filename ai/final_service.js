// ai/final_service.js - Production-ready AI service
require('dotenv').config();
const { AIClient } = require('./aiClient');

class CashFlowAIService {
    constructor() {
        this.client = new AIClient('regex'); // Use regex as primary
        this.stats = {
            totalRequests: 0,
            successfulParses: 0,
            failedParses: 0,
            averageConfidence: 0
        };
    }

    /**
     * Main function to parse transaction transcripts
     */
    async parseTransaction(transcript) {
        this.stats.totalRequests++;
        
        try {
            console.log(`\n🎯 Parsing: "${transcript}"`);
            const result = await this.client.parseTranscript(transcript);
            
            this.stats.successfulParses++;
            this.updateConfidenceStats(result.confidence);
            
            return {
                success: true,
                data: this.formatForFrontend(result),
                confidence: result.confidence,
                source: result.source,
                processingTime: result.processingTime || 0
            };
            
        } catch (error) {
            this.stats.failedParses++;
            console.error('❌ Parse error:', error);
            
            return {
                success: false,
                error: 'Failed to parse transaction',
                data: null,
                confidence: 'low'
            };
        }
    }

    /**
     * Format data for frontend/backend consumption
     */
    formatForFrontend(result) {
        return {
            type: result.type,
            item: result.item,
            quantity: result.quantity,
            amount: result.amount,
            currency: result.currency,
            method: result.method,
            person: result.person,
            date: result.date,
            raw_text: result.raw,
            confidence: result.confidence,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Try multiple providers if regex fails
     */
    async parseWithFallback(transcript) {
        console.log(`\n🔄 Smart parsing with fallback: "${transcript}"`);
        
        // First try regex (fastest)
        const regexResult = await this.client.parseTranscript(transcript);
        
        if (regexResult.confidence === 'high') {
            console.log('✅ Using high-confidence regex result');
            return this.formatForFrontend(regexResult);
        }
        
        // If low confidence, try Hugging Face if available
        if (this.client.getProviderInfo().huggingFaceReady) {
            console.log('🔄 Low confidence, trying AI...');
            try {
                this.client.setProvider('huggingface');
                const aiResult = await this.client.parseTranscript(transcript);
                this.client.setProvider('regex'); // Switch back
                
                console.log('✅ Using AI result');
                return this.formatForFrontend(aiResult);
                
            } catch (aiError) {
                console.log('❌ AI failed, using regex result');
                this.client.setProvider('regex');
                return this.formatForFrontend(regexResult);
            }
        }
        
        // Fallback to regex
        console.log('✅ Using regex (fallback)');
        return this.formatForFrontend(regexResult);
    }

    updateConfidenceStats(confidence) {
        const confidenceScore = {
            'high': 100,
            'medium': 60, 
            'low': 30
        }[confidence] || 50;
        
        this.stats.averageConfidence = 
            (this.stats.averageConfidence * (this.stats.successfulParses - 1) + confidenceScore) / 
            this.stats.successfulParses;
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalRequests > 0 ? 
                (this.stats.successfulParses / this.stats.totalRequests * 100).toFixed(1) : 0,
            averageConfidence: this.stats.averageConfidence.toFixed(1)
        };
    }

    resetStats() {
        this.stats = {
            totalRequests: 0,
            successfulParses: 0,
            failedParses: 0,
            averageConfidence: 0
        };
    }
}

// Create singleton instance
const aiService = new CashFlowAIService();

// Export for backend integration
module.exports = { 
    aiService, 
    CashFlowAIService,
    // Simple one-line function for easy integration
    parseTransaction: (transcript) => aiService.parseTransaction(transcript)
};

// Demo if run directly
if (require.main === module) {
    console.log('🚀 CASHFLOW AI SERVICE - PRODUCTION READY\n');
    
    const demoTranscripts = [
        "Sold 3 bags of rice for 15k cash",
        "I collect 5k from Ngozi", 
        "Bought stock for 10k from Iya Biliki",
        "Mama Ngozi owes me 12k",
        "Took 2k as change"
    ];
    
    async function runDemo() {
        for (const transcript of demoTranscripts) {
            const result = await aiService.parseTransaction(transcript);
            console.log(`\n📝 INPUT: "${transcript}"`);
            console.log(`   ✅ Success: ${result.success}`);
            console.log(`   💰 Amount: ${result.data?.amount || 'N/A'}`);
            console.log(`   📊 Type: ${result.data?.type || 'N/A'}`);
            console.log(`   🎯 Confidence: ${result.confidence}`);
            console.log(`   ⚡ Source: ${result.source}`);
        }
        
        console.log('\n📈 SERVICE STATS:');
        console.log(aiService.getStats());
    }
    
    runDemo();
}
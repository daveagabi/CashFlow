// ai/orchestrator.js - Smart provider selection
require('dotenv').config();
const { AIClient } = require('./aiClient');

class AIOrchestrator {
    constructor() {
        this.regexClient = new AIClient('regex');
        this.hfClient = new AIClient('huggingface');
        this.useAIForComplexCases = true;
    }
    
    async parseTranscript(transcript) {
        console.log(`\n🎯 Smart parsing: "${transcript}"`);
        
        // First, try regex (fast)
        const regexResult = this.regexClient.parseWithRegex(transcript);
        
        // If regex has high confidence, use it
        if (regexResult.confidence === 'high' && this.useAIForComplexCases) {
            console.log('✅ Using regex (high confidence)');
            regexResult.source = 'regex_primary';
            return regexResult;
        }
        
        // If regex has medium/low confidence or we want AI, try Hugging Face
        if (this.useAIForComplexCases && this.hfClient.getProviderInfo().huggingFaceReady) {
            console.log('🔄 Regex confidence low, trying AI...');
            try {
                const aiResult = await this.hfClient.parseWithHuggingFace(transcript);
                aiResult.source = 'huggingface_primary';
                
                // If AI found more details, use it
                if (this.isAIResultBetter(aiResult, regexResult)) {
                    console.log('✅ Using AI (better details)');
                    return aiResult;
                } else {
                    console.log('✅ Using regex (AI didn\'t help)');
                    regexResult.source = 'regex_after_ai_check';
                    return regexResult;
                }
                
            } catch (error) {
                console.log('❌ AI failed, using regex fallback');
                regexResult.source = 'regex_ai_fallback';
                return regexResult;
            }
        }
        
        // Fallback to regex
        console.log('✅ Using regex (fallback)');
        regexResult.source = 'regex_fallback';
        return regexResult;
    }
    
    isAIResultBetter(aiResult, regexResult) {
        // AI is better if it found more specific information
        const aiScore = this.calculateDetailScore(aiResult);
        const regexScore = this.calculateDetailScore(regexResult);
        
        return aiScore > regexScore + 10; // AI needs to be significantly better
    }
    
    calculateDetailScore(result) {
        let score = 0;
        if (result.amount) score += 30;
        if (result.item) score += 20;
        if (result.quantity) score += 15;
        if (result.person) score += 15;
        if (result.method) score += 10;
        if (result.type && result.type !== 'expense') score += 10;
        return score;
    }
    
    // Enable/disable AI usage
    setAIUsage(enabled) {
        this.useAIForComplexCases = enabled;
        console.log(`🤖 AI usage: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
    
    getStatus() {
        return {
            aiEnabled: this.useAIForComplexCases,
            huggingFaceReady: this.hfClient.getProviderInfo().huggingFaceReady,
            strategy: this.useAIForComplexCases ? 'Smart routing' : 'Regex only'
        };
    }
}

module.exports = { AIOrchestrator };
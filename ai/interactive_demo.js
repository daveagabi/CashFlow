// ai/interactive_demo.js - ENHANCED WITH HUGGING FACE
require('dotenv').config();
const { AIClient } = require('./aiClient');
const readline = require('readline');

class InteractiveDemo {
    constructor(initialProvider = 'regex') {
        this.client = new AIClient(initialProvider);
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    start() {
        console.log('🎤 VOICE-TO-TRANSACTION PARSER DEMO');
        console.log('====================================');
        
        const info = this.client.getProviderInfo();
        console.log(`Current Provider: ${info.current}`);
        console.log(`Hugging Face: ${info.huggingFaceReady ? '✅ Ready' : '❌ Not configured'}`);
        
        console.log('\n📝 Available commands:');
        console.log('  - Type transaction (e.g., "Sold 3 bags of rice for 15k cash")');
        console.log('  - "switch huggingface" - Use AI (if token configured)');
        console.log('  - "switch regex" - Use fast regex parser');
        console.log('  - "providers" - Show available providers');
        console.log('  - "test all" - Run comprehensive tests');
        console.log('  - "quit" - Exit');
        console.log('');
        
        this.ask();
    }

    ask() {
        this.rl.question('💬 Enter transaction or command: ', async (input) => {
            if (input.toLowerCase() === 'quit') {
                console.log('👋 Goodbye!');
                this.rl.close();
                return;
            }

            await this.processInput(input);
            this.ask();
        });
    }

    async processInput(input) {
        const lowerInput = input.toLowerCase().trim();
        
        if (lowerInput.startsWith('switch ')) {
            const provider = lowerInput.replace('switch ', '');
            this.handleSwitchProvider(provider);
            return;
        }

        switch (lowerInput) {
            case 'providers':
                this.showProviders();
                return;
            case 'test all':
                await this.runTests();
                return;
            case 'status':
                this.showStatus();
                return;
        }

        await this.processTransaction(input);
    }

    handleSwitchProvider(provider) {
        const info = this.client.getProviderInfo();
        
        if (provider === 'huggingface' && !info.huggingFaceReady) {
            console.log('❌ Hugging Face not available - check your .env file');
            console.log('💡 Make sure HUGGING_FACE_TOKEN is set in your .env');
            return;
        }

        if (info.available.includes(provider)) {
            this.client.setProvider(provider);
        } else {
            console.log(`❌ Provider '${provider}' not available`);
            console.log(`✅ Available: ${info.available.join(', ')}`);
        }
    }

    showProviders() {
        const info = this.client.getProviderInfo();
        console.log('\n🔧 AVAILABLE PROVIDERS:');
        info.available.forEach(provider => {
            const status = provider === info.current ? ' (current)' : '';
            console.log(`  - ${provider}${status}`);
        });
        console.log(`\nHugging Face Token: ${info.huggingFaceReady ? '✅ Configured' : '❌ Missing'}`);
    }

    showStatus() {
        const info = this.client.getProviderInfo();
        console.log('\n📊 SYSTEM STATUS:');
        console.log(`  Current Provider: ${info.current}`);
        console.log(`  Hugging Face: ${info.huggingFaceReady ? '✅ Ready' : '❌ Not configured'}`);
        console.log(`  Available: ${info.available.join(', ')}`);
    }

    async processTransaction(input) {
        try {
            console.log('⏳ Processing...');
            const result = await this.client.parseTranscript(input);
            
            console.log('\n📊 PARSING RESULT:');
            console.log(JSON.stringify(result, null, 2));
            console.log(`\n⏱️  Time: ${result.processingTime}ms | Source: ${result.source} | Confidence: ${result.confidence}`);
            
            if (result.fallbackReason) {
                console.log(`🔄 Fallback reason: ${result.fallbackReason}`);
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`💥 Error: ${error.message}\n`);
        }
    }

    async runTests() {
        console.log('\n🧪 Running comprehensive tests...');
        const { runComprehensiveTests } = require('./enhanced_tests');
        await runComprehensiveTests();
    }
}

// Get provider from command line or use default
const initialProvider = process.argv[2] || 'regex';

// Start demo if run directly
if (require.main === module) {
    const demo = new InteractiveDemo(initialProvider);
    demo.start();
}

module.exports = { InteractiveDemo };
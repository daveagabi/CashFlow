// ai/aiClient.js - COMPLETE INTEGRATED VERSION
require('dotenv').config();
const TransactionParser = require('./parser');

class AIClient {
    constructor(provider = process.env.AI_PROVIDER || 'regex') {
        this.provider = provider;
        this.parser = new TransactionParser();
        this.huggingFaceToken = process.env.HUGGING_FACE_TOKEN;
        this.setupProvider();
    }

    setupProvider() {
        console.log(`🤖 AI Provider: ${this.provider.toUpperCase()}`);
        
        switch (this.provider) {
            case 'huggingface':
                if (!this.huggingFaceToken) {
                    console.log('❌ No Hugging Face token found in .env file');
                    console.log('⚠️  Falling back to regex parser');
                    this.provider = 'regex';
                    this.parseFunction = this.parseWithRegex.bind(this);
                } else {
                    console.log('✅ Hugging Face token found');
                    this.parseFunction = this.parseWithHuggingFace.bind(this);
                }
                break;
            case 'regex':
            default:
                this.parseFunction = this.parseWithRegex.bind(this);
        }
    }

    async parseTranscript(transcript) {
        console.log(`\n🎯 Parsing: "${transcript}"`);
        
        try {
            const startTime = Date.now();
            const result = await this.parseFunction(transcript);
            const endTime = Date.now();
            
            result.processingTime = endTime - startTime;
            result.source = this.provider;
            
            console.log(`✅ Success with ${this.provider} (${result.processingTime}ms)`);
            return result;
            
        } catch (error) {
            console.log(`❌ ${this.provider} failed: ${error.message}`);
            console.log('🔄 Using regex fallback...');
            
            const fallbackResult = this.parseWithRegex(transcript);
            fallbackResult.source = 'regex_fallback';
            fallbackResult.fallbackReason = error.message;
            
            return fallbackResult;
        }
    }

    // Regex Parser (Fast & Reliable)
    parseWithRegex(transcript) {
        return this.parser.parse(transcript);
    }

    // Hugging Face Inference API
    async parseWithHuggingFace(transcript) {
        const prompt = `Extract transaction from Nigerian market text. Return ONLY JSON.

Text: "${transcript}"

Output ONLY this JSON format:
{
  "type": "income|expense|debt",
  "item": "item or null", 
  "quantity": number or null,
  "amount": number,
  "currency": "NGN",
  "method": "cash|pos|transfer|null",
  "person": "name or null",
  "date": null,
  "raw": "original text"
}

Examples:
"Sold 3 bags of rice for 15k cash" -> {"type":"income","item":"rice","quantity":3,"amount":15000,"currency":"NGN","method":"cash","person":null,"date":null,"raw":"Sold 3 bags of rice for 15k cash"}
"I collect 5k from Ngozi" -> {"type":"income","item":null,"quantity":null,"amount":5000,"currency":"NGN","method":null,"person":"Ngozi","date":null,"raw":"I collect 5k from Ngozi"}

Return ONLY JSON:`;

        const response = await fetch(
            'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.huggingFaceToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 200,
                        temperature: 0.1,
                        return_full_text: false
                    }
                }),
            }
        );

        if (response.status === 503) {
            throw new Error('Model is loading, please wait 20 seconds and try again');
        }

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Model error: ${data.error}`);
        }

        const generatedText = data[0]?.generated_text || '';
        console.log('🤖 AI Raw:', generatedText.substring(0, 100) + '...');

        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return this.cleanAIResult(parsed, transcript);
    }

    cleanAIResult(aiResult, transcript) {
        return {
            type: ['income', 'expense', 'debt'].includes(aiResult.type) ? aiResult.type : 'expense',
            item: aiResult.item || null,
            quantity: typeof aiResult.quantity === 'number' ? aiResult.quantity : null,
            amount: typeof aiResult.amount === 'number' ? aiResult.amount : null,
            currency: 'NGN',
            method: ['cash', 'pos', 'transfer'].includes(aiResult.method) ? aiResult.method : null,
            person: aiResult.person || null,
            date: null,
            raw: transcript
        };
    }

    setProvider(provider) {
        this.provider = provider;
        this.setupProvider();
        console.log(`🔄 Switched to: ${provider}`);
    }

    getProviderInfo() {
        return {
            current: this.provider,
            huggingFaceReady: !!this.huggingFaceToken,
            available: this.huggingFaceToken ? ['regex', 'huggingface'] : ['regex']
        };
    }
}

module.exports = { AIClient };
// ai/parser.js - COPY AND PASTE THIS ENTIRE FILE
class TransactionParser {
    constructor() {
        this.items = ['rice', 'beans', 'tomato', 'stock', 'goods', 'bag', 'crate', 'change'];
        this.peoplePatterns = [
            /(?:from|to|by|for)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
            /(?:from|to|by|for)\s+([A-Z][a-z]+)/,
            /(?:mama|baba|iya|brother|sister)\s+([A-Z][a-z]+)/i
        ];
    }

    parse(transcript) {
        const lower = transcript.toLowerCase();
        
        return {
            type: this.detectType(lower),
            item: this.extractItem(lower),
            quantity: this.extractQuantity(transcript),
            amount: this.extractAmount(transcript),
            currency: 'NGN',
            method: this.extractPaymentMethod(lower),
            person: this.extractPerson(transcript),
            date: null,
            raw: transcript,
            confidence: this.calculateConfidence(transcript),
            source: 'regex_parser'
        };
    }

    detectType(lowerTranscript) {
        if (/(sold|collect|received|paid me|give me|i get|i collect|na him pay me)/i.test(lowerTranscript)) 
            return 'income';
        if (/(owe|debt|borrow|i owe|i dey owe|him owe|she owe|na him owe)/i.test(lowerTranscript)) 
            return 'debt';
        if (/(buy|bought|spent|pay|i buy|i pay|i spend|make i buy)/i.test(lowerTranscript)) 
            return 'expense';
        return 'expense';
    }

    extractAmount(transcript) {
        const patterns = [
            /(\d+(?:,\d{3})*)\s*(k|kobo|naira|ngn)/i,
            /(\d+)k/i,
            /(\d+(?:\.\d{2})?)\s*(thousand|grand)/i,
            /(\d+)\s*(\d{3})/,
            /\b(\d{3,})\b/
        ];

        for (const pattern of patterns) {
            const match = transcript.match(pattern);
            if (match) {
                let amountStr = match[0].replace(/[kK]|thousand|grand|naira|ngn|,/g, '').trim();
                let amount = parseInt(amountStr.replace(/\s+/g, ''));
                
                if (/(\d+)k/i.test(match[0])) amount *= 1000;
                if (/(\d+)\s*(thousand|grand)/i.test(match[0])) amount *= 1000;
                
                return amount;
            }
        }
        return null;
    }

    extractItem(lowerTranscript) {
        for (const item of this.items) {
            if (lowerTranscript.includes(item)) return item;
        }
        return null;
    }

    extractQuantity(transcript) {
        const match = transcript.match(/\b(\d+)\s+(bag|bags|crate|crates|item|items|piece|pieces)/i);
        return match ? parseInt(match[1]) : null;
    }

    extractPaymentMethod(lowerTranscript) {
        if (lowerTranscript.includes('cash')) return 'cash';
        if (lowerTranscript.includes('pos') || lowerTranscript.includes('card')) return 'pos';
        if (lowerTranscript.includes('transfer') || lowerTranscript.includes('bank')) return 'transfer';
        return null;
    }

    extractPerson(transcript) {
        for (const pattern of this.peoplePatterns) {
            const match = transcript.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    calculateConfidence(transcript) {
        let score = 0;
        if (this.extractAmount(transcript)) score += 40;
        if (this.detectType(transcript.toLowerCase()) !== 'expense') score += 30;
        if (this.extractItem(transcript.toLowerCase())) score += 20;
        if (this.extractQuantity(transcript)) score += 10;
        
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }
}

// ✅ CRITICAL: Export the class directly
module.exports = TransactionParser;
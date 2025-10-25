const express = require('express');
const router = express.Router();

// AI Parsing function - converts voice text to structured transaction data
const parseVoiceToTransaction = (voiceText, userId) => {
  try {
    console.log('🎤 Parsing voice input:', voiceText);

    // Clean up the input
    const text = voiceText.toLowerCase().trim();
    
    // Extract amount using various patterns
    const amountPatterns = [
      /(?:spent|paid|cost|bought|purchase[d]?)\s*(?:about|around)?\s*\$?(\d+(?:\.\d{2})?)/i,
      /\$(\d+(?:\.\d{2})?)/,
      /(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?|usd)/i,
      /(\d+(?:\.\d{2})?)\s*(?:for|on)/i
    ];

    let amount = null;
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        amount = parseFloat(match[1]);
        break;
      }
    }

    if (!amount) {
      throw new Error('Could not extract amount from voice input');
    }

    // Determine transaction type
    const expenseKeywords = ['spent', 'paid', 'bought', 'purchase', 'cost', 'expense', 'bill'];
    const incomeKeywords = ['earned', 'received', 'got paid', 'salary', 'income', 'bonus'];
    
    let type = 'expense'; // default
    if (incomeKeywords.some(keyword => text.includes(keyword))) {
      type = 'income';
    }

    // Extract description - everything after amount or spending verb
    let description = voiceText;
    
    // Remove amount mentions
    description = description.replace(/\$?\d+(?:\.\d{2})?/g, '').trim();
    
    // Remove common spending verbs
    description = description.replace(/\b(spent|paid|bought|purchase[d]?|cost|for|on|about|around)\b/gi, '').trim();
    
    // Clean up extra spaces and common words
    description = description.replace(/\s+/g, ' ').replace(/^(a|an|the|some)\s+/i, '').trim();
    
    if (!description || description.length < 3) {
      description = type === 'income' ? 'Income received' : 'Expense recorded';
    }

    // Categorize based on keywords
    const categories = {
      food: ['lunch', 'dinner', 'breakfast', 'coffee', 'restaurant', 'food', 'eat', 'meal', 'snack', 'pizza', 'burger'],
      transport: ['uber', 'taxi', 'bus', 'train', 'gas', 'fuel', 'parking', 'metro', 'subway', 'ride'],
      shopping: ['clothes', 'shoes', 'shopping', 'store', 'buy', 'purchase', 'shirt', 'dress', 'pants'],
      entertainment: ['movie', 'cinema', 'game', 'concert', 'show', 'fun', 'theater', 'netflix', 'spotify'],
      health: ['doctor', 'medicine', 'pharmacy', 'hospital', 'health', 'medical', 'dentist', 'clinic'],
      utilities: ['electricity', 'water', 'internet', 'phone', 'bill', 'utility', 'rent', 'mortgage'],
      groceries: ['grocery', 'groceries', 'supermarket', 'walmart', 'target', 'market', 'vegetables', 'fruits'],
      income: ['salary', 'wage', 'bonus', 'freelance', 'payment', 'earnings', 'paycheck']
    };

    let category = 'other';
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        category = cat;
        break;
      }
    }

    // If it's income, override category
    if (type === 'income' && category === 'other') {
      category = 'income';
    }

    const transaction = {
      amount,
      description,
      category,
      type,
      userId,
      voiceData: voiceText,
      confidence: calculateConfidence(voiceText, amount, description),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('✅ Parsed transaction:', transaction);
    return transaction;

  } catch (error) {
    console.error('❌ Voice parsing error:', error.message);
    throw error;
  }
};

// Calculate confidence score for the parsing
const calculateConfidence = (voiceText, amount, description) => {
  let confidence = 0.5; // base confidence

  // Higher confidence if amount is clearly stated
  if (voiceText.includes('$') || /\d+\.\d{2}/.test(voiceText)) {
    confidence += 0.2;
  }

  // Higher confidence if spending verbs are present
  if (/spent|paid|bought|cost/.test(voiceText.toLowerCase())) {
    confidence += 0.2;
  }

  // Higher confidence if description is meaningful
  if (description && description.length > 5) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
};

// POST /api/voice/parse - Parse voice input to transaction JSON
router.post('/parse', async (req, res) => {
  try {
    const { voiceText, userId } = req.body;

    if (!voiceText || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['voiceText', 'userId']
      });
    }

    // Parse the voice input
    const parsedTransaction = parseVoiceToTransaction(voiceText, userId);

    res.json({
      success: true,
      message: 'Voice input parsed successfully',
      data: parsedTransaction,
      originalInput: voiceText
    });

  } catch (error) {
    console.error('Voice parsing error:', error);
    res.status(400).json({
      error: 'Failed to parse voice input',
      message: error.message,
      suggestion: 'Try saying something like "I spent $20 on lunch" or "I received $500 salary"'
    });
  }
});

// POST /api/voice/parse-and-save - Parse voice input and save to database
router.post('/parse-and-save', async (req, res) => {
  try {
    const { voiceText, userId } = req.body;

    if (!voiceText || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['voiceText', 'userId']
      });
    }

    // Parse the voice input
    const parsedTransaction = parseVoiceToTransaction(voiceText, userId);

    // Save to database using existing transaction logic
    const { getFirestore } = require('../config/firebase');
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();

    const docRef = await db.collection('transactions').add(parsedTransaction);

    const savedTransaction = {
      id: docRef.id,
      ...parsedTransaction
    };

    // Trigger integrations for large expenses
    if (parsedTransaction.amount > 100) {
      try {
        const ServiceNowIntegration = require('../servicenow');
        const serviceNow = new ServiceNowIntegration();
        await serviceNow.createSpendingAlert(savedTransaction);
        console.log('📋 ServiceNow alert created for voice transaction');
      } catch (error) {
        console.log('⚠️ ServiceNow integration skipped:', error.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Voice input parsed and saved successfully',
      data: savedTransaction,
      originalInput: voiceText,
      confidence: parsedTransaction.confidence
    });

  } catch (error) {
    console.error('Voice parse-and-save error:', error);
    res.status(400).json({
      error: 'Failed to parse and save voice input',
      message: error.message
    });
  }
});

// GET /api/voice/test-phrases - Get test phrases for voice input
router.get('/test-phrases', (req, res) => {
  const { accent = 'all' } = req.query;

  const testPhrases = {
    // Standard American English
    american: [
      "I spent twenty-five dollars on lunch at McDonald's",
      "Paid one hundred fifty bucks for groceries at Walmart",
      "Bought coffee for four fifty this morning",
      "Received two thousand dollar salary payment today"
    ],
    
    // British English variations
    british: [
      "I spent twenty-five pounds on lunch at Tesco",
      "Paid one hundred fifty quid for shopping",
      "Bought coffee for four pounds fifty this morning",
      "Received two thousand pound salary today"
    ],
    
    // Nigerian English (as per your hackathon context)
    nigerian: [
      "I spent two thousand naira on lunch at Mr. Biggs",
      "Paid fifteen thousand naira for groceries at Shoprite", 
      "Bought coffee for five hundred naira this morning",
      "Received one hundred thousand naira salary payment today"
    ],
    
    // Casual/Informal speech
    casual: [
      "Spent like twenty-five bucks on some food",
      "Paid about one-fifty for groceries and stuff",
      "Got coffee, cost me four-fifty or something",
      "My salary came in, two thousand dollars"
    ],
    
    // Real-world scenarios for demo
    demo: [
      "I just spent forty-five dollars on lunch at that new restaurant downtown",
      "Mama Ngozi paid me back twelve thousand naira she owed me",
      "Bought groceries for one hundred twenty dollars at Whole Foods",
      "Received my freelance payment of eight hundred fifty dollars today"
    ]
  };

  let selectedPhrases = [];
  
  if (accent === 'all') {
    // Return mix of all accents for comprehensive testing
    selectedPhrases = [
      ...testPhrases.american.slice(0, 2),
      ...testPhrases.nigerian.slice(0, 2),
      ...testPhrases.casual.slice(0, 2),
      ...testPhrases.demo
    ];
  } else if (testPhrases[accent]) {
    selectedPhrases = testPhrases[accent];
  } else {
    selectedPhrases = testPhrases.demo;
  }

  res.json({
    success: true,
    message: `Test phrases for voice input (${accent} accent)`,
    data: {
      phrases: selectedPhrases,
      availableAccents: Object.keys(testPhrases),
      demoReady: testPhrases.demo
    },
    usage: 'Use these phrases to test the /parse or /parse-and-save endpoints',
    tip: 'Try different accents with ?accent=american|british|nigerian|casual|demo'
  });
});

// POST /api/voice/demo-test - Run live demo test with all accents
router.post('/demo-test', async (req, res) => {
  try {
    const { userId = 'demo-user-' + Date.now() } = req.body;
    
    console.log('🎤 Running live demo test with different accents...');

    const demoResults = [];
    
    // Test phrases from different accents
    const testCases = [
      { phrase: "I spent forty-five dollars on lunch at McDonald's", accent: "American" },
      { phrase: "Paid fifteen thousand naira for groceries at Shoprite", accent: "Nigerian" },
      { phrase: "Bought coffee for four pounds fifty this morning", accent: "British" },
      { phrase: "Got my salary, two thousand bucks", accent: "Casual" }
    ];

    for (const testCase of testCases) {
      try {
        const parsed = parseVoiceToTransaction(testCase.phrase, userId);
        demoResults.push({
          input: testCase.phrase,
          accent: testCase.accent,
          output: parsed,
          status: 'success',
          confidence: parsed.confidence
        });
      } catch (error) {
        demoResults.push({
          input: testCase.phrase,
          accent: testCase.accent,
          output: null,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Demo test completed with multiple accents',
      data: {
        userId,
        testResults: demoResults,
        summary: {
          total: demoResults.length,
          successful: demoResults.filter(r => r.status === 'success').length,
          failed: demoResults.filter(r => r.status === 'failed').length,
          avgConfidence: demoResults
            .filter(r => r.status === 'success')
            .reduce((sum, r) => sum + r.confidence, 0) / demoResults.filter(r => r.status === 'success').length
        }
      }
    });

  } catch (error) {
    console.error('Demo test error:', error);
    res.status(500).json({
      error: 'Demo test failed',
      message: error.message
    });
  }
});

module.exports = router;
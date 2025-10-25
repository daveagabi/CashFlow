// src/utils/api.js - API service for backend communication
import axios from 'axios';

// Backend API base URL - coordinate with your backend engineer
// Backend API base URL - using laptop IP address
const API_BASE_URL = 'http://192.168.0.104:3000';
const API_BASE = __DEV__
  ? API_BASE_URL  // Development - backend laptop IP
  : 'https://your-vercel-url.vercel.app'; // Production - replace with actual Vercel URL

// Flag to disable backend calls during development
const BACKEND_ENABLED = true; // Set to true when backend is ready

// Add authentication headers if needed
const getAuthHeaders = () => {
  // Add user token here when you implement auth
  return {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${userToken}` // Uncomment when auth is ready
  };
};

// Parse transcript into structured transaction
export const parseTranscript = async (transcript) => {
  // Skip backend call if not enabled
  if (!BACKEND_ENABLED) {
    console.log('Backend disabled, using local parsing:', transcript);
    return parseTranscriptLocally(transcript);
  }

  try {
    console.log('Sending transcript to backend for parsing:', transcript);

    const response = await axios.post(`${API_BASE}/api/transactions`, {
      transcript: transcript
    }, {
      headers: getAuthHeaders(),
      timeout: 10000 // 10 second timeout
    });

    console.log('Backend parse response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Backend parse failed, using local fallback:', error.message);

    // Fallback: Simple local parsing if backend is unavailable
    return parseTranscriptLocally(transcript);
  }
};

// Sync transactions to backend
export const syncTransactions = async (transactions) => {
  try {
    console.log('Syncing transactions to backend:', transactions.length, 'transactions');

    const response = await axios.post(`${API_BASE}/api/transactions`, {
      transactions: transactions
    }, {
      headers: getAuthHeaders(),
      timeout: 30000 // 30 second timeout for sync
    });

    console.log('Backend sync successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Backend sync failed:', error.message);
    throw error;
  }
};

// Get all transactions from backend (for initial sync)
export const fetchTransactionsFromBackend = async () => {
  try {
    console.log('Fetching transactions from backend...');

    const response = await axios.get(`${API_BASE}/api/transactions`, {
      headers: getAuthHeaders(),
      timeout: 15000
    });

    console.log('Backend transactions fetched:', response.data.length, 'transactions');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch transactions from backend:', error.message);
    throw error;
  }
};

// Check if backend is available
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.log('Backend not available:', error.message);
    return false;
  }
};

// Get weekly summary from backend
export const getWeeklySummary = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/transactions`, {
      headers: getAuthHeaders(),
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get weekly summary:', error.message);
    throw error;
  }
};

// Simple local parsing as fallback - Enhanced for Nigerian English/Pidgin
const parseTranscriptLocally = (transcript) => {
  console.log('Using local parsing fallback');

  const text = transcript.toLowerCase();

  // Extract amount - prioritize numbers with 'k' or 'naira' (the actual price)
  let amount = 0;

  // First try to find amount with 'k' (this is usually the price)
  const amountWithK = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*k/i);
  if (amountWithK) {
    amount = parseFloat(amountWithK[1].replace(/,/g, '')) * 1000;
  } else {
    // Fallback to naira or standalone numbers
    const amountWithNaira = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*naira/i);
    if (amountWithNaira) {
      amount = parseFloat(amountWithNaira[1].replace(/,/g, ''));
    } else {
      // Last resort: find the largest number in the text (likely the price)
      const allNumbers = text.match(/\d+/g);
      if (allNumbers) {
        const numbers = allNumbers.map(n => parseInt(n));
        amount = Math.max(...numbers); // Take the largest number as the price
      }
    }
  }

  // Enhanced transaction type detection for Nigerian English/Pidgin
  // Separate actual income from receivables/debts
  const isActualIncome = /sold|sell|sale|income|received|got|earned|don sell|pay me|have pay/i.test(text);
  const isReceivable = /dey owe/i.test(text); // Someone owes you (not income yet)
  const isPurchase = /bought|buy|purchase|paid|spend|spent|expense|took|transport/i.test(text);

  // Determine transaction type
  let type;
  if (isActualIncome && !isReceivable) {
    type = 'income'; // Money actually received
  } else if (isReceivable) {
    type = 'receivable'; // Money owed to you (not income yet)
  } else if (isPurchase) {
    type = 'expense'; // Money spent
  } else {
    type = 'expense'; // Default to expense
  }

  // Enhanced description extraction for Nigerian patterns
  let description = '';

  if (type === 'income' || type === 'receivable') {
    // Nigerian patterns: "I don sell [item]", "Mama [name] have pay me", "[name] dey owe me"
    const nigerianIncomePatterns = [
      /(?:don sell|sold|sell)\s+(.+?)\s+(?:for|to|customer|\d)/i,
      /(mama\s+\w+|daddy\s+\w+|\w+)\s+(?:have pay|pay)\s+me/i, // Preserve Mama/Daddy names
      /(mama\s+\w+|daddy\s+\w+|\w+)\s+dey owe me/i, // Preserve Mama/Daddy names
      /sold\s+(?:one|\d+)\s+(.+?)\s+for/i // "sold one jean for" or "sold 1 jean for"
    ];

    for (const pattern of nigerianIncomePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.source.includes('sold\\s+(?:one|\\d+)')) {
          // Handle "sold one jean" or "sold 1 jean" pattern
          description = match[1].trim(); // Just take the item name, not the quantity
        } else {
          description = match[1].trim();
        }
        break;
      }
    }
  } else if (type === 'expense') {
    // Enhanced purchase patterns with better phrase extraction
    const purchasePatterns = [
      /i\s+(?:bought|buy)\s+(.+?)\s+(?:for|\d)/i, // "I bought [item] for"
      /i\s+paid\s+(?:for\s+)?(.+?)\s+\d/i, // "I paid for [item] 30k"
      /paid\s+(.+?)\s+for\s+\d/i, // "paid rent for 100k"
      /took\s+(.+?)(?:\s+\d|$)/i, // "took transport"
      /bought\s+(.+?)(?:\s+for|\s+\d|$)/i // General bought pattern
    ];

    for (const pattern of purchasePatterns) {
      const match = text.match(pattern);
      if (match) {
        description = match[1].trim();
        break;
      }
    }
  }

  // Smart cleanup - preserve Mama/Daddy when part of names
  if (description) {
    description = description
      .replace(/\d+(?:,\d{3})*(?:\.\d{2})?\s*k?/gi, '') // Remove amounts
      .replace(/naira/gi, '') // Remove naira
      .replace(/\bi\s+/gi, '') // Remove standalone "I"
      .replace(/\s+/g, ' ') // Clean multiple spaces
      .trim();

    // Don't remove Mama/Daddy if they're followed by a name
    if (!/(?:mama|daddy)\s+\w+/i.test(description)) {
      description = description.replace(/\b(?:mama|daddy|customer|my)\b/gi, '');
    }

    description = description.replace(/\s+/g, ' ').trim();
  }

  // Enhanced fallback descriptions based on patterns
  if (!description || description.length < 2) {
    if (text.includes('pay me') || text.includes('have pay')) {
      description = 'Payment received from customer';
    } else if (text.includes('dey owe')) {
      description = 'Outstanding debt (not yet paid)';
    } else if (text.includes('don sell')) {
      description = 'Product sold to customer';
    } else if (text.includes('transport')) {
      description = 'Transportation fare';
    } else if (text.includes('rent')) {
      description = 'Monthly rent payment';
    } else if (text.includes('electricity')) {
      description = 'Electricity bill payment';
    } else if (text.includes('fuel')) {
      description = 'Fuel purchase';
    } else if (text.includes('groceries')) {
      description = 'Grocery shopping';
    } else if (text.includes('medicine')) {
      description = 'Medical expenses';
    } else if (type === 'income') {
      description = 'Product sold';
    } else if (type === 'receivable') {
      description = 'Money owed to you';
    } else if (type === 'expense') {
      description = 'Business expense';
    } else {
      description = 'Business transaction';
    }
  }

  return {
    id: Date.now().toString(),
    type: type,
    amount: amount, // Amount already processed above
    description: description,
    timestamp: new Date().toISOString(),
    synced: false,
    originalTranscript: transcript
  };
};

// Upload audio to backend for Whisper processing
export const xxuploadAudioToWhisper = async (audioUri) => {
  try {
    console.log('Uploading audio from:', audioUri);

    // Create FormData for file upload
    const formData = new FormData();

    // Extract filename from URI
    const filename = audioUri.split('/').pop();

    // Append the file - note the type adjustment for different platforms
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a', // or 'audio/wav' depending on your recording format
      name: filename || 'recording.m4a',
    });

    const response = await axios.post(`${API_BASE}/api/voice`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout for audio processing
    });

    console.log('Whisper response:', response.data);
    return response.data.transcript;
  } catch (error) {
    console.error('Error uploading audio to Whisper:', error);
    throw new Error('Failed to process audio. Please try again.');
  }
};

export default {
  parseTranscript,
  syncTransactions,
  uploadAudioToWhisper,
  getWeeklySummary,
  fetchTransactionsFromBackend,
  checkBackendHealth
};
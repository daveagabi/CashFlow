// src/utils/api.js - API service for backend communication
import axios from 'axios';

// Backend API base URL - coordinate with your backend engineer
const API_BASE = __DEV__ 
  ? 'http://YOUR_BACKEND_IP:3000/api'  // Development - backend engineer's local server
  : 'https://your-deployed-backend.com/api'; // Production - deployed backend URL

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
    
    const response = await axios.post(`${API_BASE}/parse`, {
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
    
    const response = await axios.post(`${API_BASE}/sync`, {
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
    
    const response = await axios.get(`${API_BASE}/transactions`, {
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

// Simple local parsing as fallback
const parseTranscriptLocally = (transcript) => {
  console.log('Using local parsing fallback');
  
  const text = transcript.toLowerCase();
  
  // Extract amount (look for numbers followed by 'k' or 'naira')
  const amountMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*k?/i) || 
                     text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*naira/i);
  
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  
  // Determine transaction type
  const isSale = /sold|sell|sale|income|received|got|earned/i.test(text);
  const isPurchase = /bought|buy|purchase|paid|spend|spent|expense/i.test(text);
  
  const type = isSale ? 'income' : isPurchase ? 'expense' : 'expense';
  
  // Extract description - better logic to get the item name
  let description = '';
  
  // Try to extract item between action word and amount/price
  if (isSale) {
    // For sales: "I sold [item] for [amount]"
    const saleMatch = text.match(/(?:sold|sell)\s+(.+?)\s+(?:for|at|\d)/i);
    if (saleMatch) {
      description = saleMatch[1].trim();
    }
  } else if (isPurchase) {
    // For purchases: "I bought [item] for [amount]" or "I paid [amount] for [item]"
    const buyMatch = text.match(/(?:bought|buy)\s+(.+?)\s+(?:for|at|\d)/i);
    const paidMatch = text.match(/(?:paid|spend|spent).+?(?:for|on)\s+(.+?)(?:\s+\d|$)/i);
    
    if (buyMatch) {
      description = buyMatch[1].trim();
    } else if (paidMatch) {
      description = paidMatch[1].trim();
    }
  }
  
  // Clean up the description
  if (description) {
    description = description
      .replace(/\d+(?:,\d{3})*(?:\.\d{2})?\s*k?/gi, '') // Remove amounts
      .replace(/naira/gi, '') // Remove naira
      .replace(/\s+/g, ' ') // Clean multiple spaces
      .trim();
  }
  
  // Fallback descriptions
  if (!description || description.length < 2) {
    if (isSale) {
      description = 'Item sold';
    } else if (isPurchase) {
      description = 'Item purchased';
    } else {
      description = 'Transaction';
    }
  }
  
  return {
    id: Date.now().toString(),
    type: type,
    amount: amount * (text.includes('k') ? 1000 : 1), // Convert 'k' to thousands
    description: description,
    timestamp: new Date().toISOString(),
    synced: false,
    originalTranscript: transcript
  };
};

export default {
  parseTranscript,
  syncTransactions
};
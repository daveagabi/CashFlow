// src/utils/syncService.js - Handles sync between local storage and backend
import { getTransactions, getUnsyncedTransactions, markTransactionsSynced, saveTransaction } from './storage';
import { syncTransactions, fetchTransactionsFromBackend, checkBackendHealth } from './api';
import NetInfo from '@react-native-community/netinfo';

// Check if device is online
export const isOnline = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected && netInfo.isInternetReachable;
  } catch (error) {
    console.log('Network check failed, assuming offline');
    return false;
  }
};

// Sync unsynced transactions to backend
export const syncToBackend = async () => {
  try {
    console.log('Starting sync to backend...');
    
    // Check if online
    const online = await isOnline();
    if (!online) {
      throw new Error('Device is offline');
    }
    
    // Check if backend is available
    const backendAvailable = await checkBackendHealth();
    if (!backendAvailable) {
      throw new Error('Backend is not available');
    }
    
    // Get unsynced transactions
    const unsyncedTransactions = await getUnsyncedTransactions();
    
    if (unsyncedTransactions.length === 0) {
      console.log('No transactions to sync');
      return { success: true, synced: 0 };
    }
    
    console.log(`Syncing ${unsyncedTransactions.length} transactions...`);
    
    // Send to backend
    const response = await syncTransactions(unsyncedTransactions);
    
    // Mark as synced locally
    const transactionIds = unsyncedTransactions.map(tx => tx.id);
    await markTransactionsSynced(transactionIds);
    
    console.log('Sync completed successfully');
    return { 
      success: true, 
      synced: unsyncedTransactions.length,
      response: response 
    };
    
  } catch (error) {
    console.error('Sync failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      synced: 0 
    };
  }
};

// Download transactions from backend (initial sync)
export const syncFromBackend = async () => {
  try {
    console.log('Starting sync from backend...');
    
    // Check if online
    const online = await isOnline();
    if (!online) {
      throw new Error('Device is offline');
    }
    
    // Get transactions from backend
    const backendTransactions = await fetchTransactionsFromBackend();
    
    // Get local transactions
    const localTransactions = await getTransactions();
    const localIds = new Set(localTransactions.map(tx => tx.id));
    
    // Find new transactions from backend
    const newTransactions = backendTransactions.filter(tx => !localIds.has(tx.id));
    
    // Save new transactions locally (mark as synced)
    for (const transaction of newTransactions) {
      await saveTransaction({ ...transaction, synced: true });
    }
    
    console.log(`Downloaded ${newTransactions.length} new transactions from backend`);
    return { 
      success: true, 
      downloaded: newTransactions.length 
    };
    
  } catch (error) {
    console.error('Download from backend failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      downloaded: 0 
    };
  }
};

// Full sync: upload unsynced, download new
export const fullSync = async () => {
  try {
    console.log('Starting full sync...');
    
    const uploadResult = await syncToBackend();
    const downloadResult = await syncFromBackend();
    
    return {
      success: uploadResult.success && downloadResult.success,
      uploaded: uploadResult.synced,
      downloaded: downloadResult.downloaded,
      errors: [
        ...(uploadResult.success ? [] : [uploadResult.error]),
        ...(downloadResult.success ? [] : [downloadResult.error])
      ]
    };
    
  } catch (error) {
    console.error('Full sync failed:', error.message);
    return {
      success: false,
      uploaded: 0,
      downloaded: 0,
      errors: [error.message]
    };
  }
};

// Auto-sync when app becomes active (background sync)
export const autoSync = async () => {
  try {
    const online = await isOnline();
    if (!online) return;
    
    const unsyncedCount = (await getUnsyncedTransactions()).length;
    if (unsyncedCount === 0) return;
    
    console.log(`Auto-syncing ${unsyncedCount} transactions...`);
    await syncToBackend();
  } catch (error) {
    console.log('Auto-sync failed silently:', error.message);
  }
};

export default {
  isOnline,
  syncToBackend,
  syncFromBackend,
  fullSync,
  autoSync
};
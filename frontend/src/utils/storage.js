// src/utils/storage.js - Local storage using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSACTIONS_KEY = 'transactions';

// Get all transactions from local storage
export const getTransactions = async () => {
    try {
        const raw = await AsyncStorage.getItem(TRANSACTIONS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
    }
};

// Save a new transaction locally
export const saveTransaction = async (transaction) => {
    try {
        const transactions = await getTransactions();

        // Add new transaction to the beginning of the list
        transactions.unshift({
            ...transaction,
            id: transaction.id || Date.now().toString(),
            timestamp: transaction.timestamp || new Date().toISOString(),
            synced: false
        });

        await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
        console.log('Transaction saved locally:', transaction);

        return transactions;
    } catch (error) {
        console.error('Error saving transaction:', error);
        throw error;
    }
};

// Update transaction sync status
export const markTransactionsSynced = async (transactionIds) => {
    try {
        const transactions = await getTransactions();

        const updatedTransactions = transactions.map(tx =>
            transactionIds.includes(tx.id) ? { ...tx, synced: true } : tx
        );

        await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
        console.log('Transactions marked as synced:', transactionIds);

        return updatedTransactions;
    } catch (error) {
        console.error('Error marking transactions as synced:', error);
        throw error;
    }
};

// Get unsynced transactions
export const getUnsyncedTransactions = async () => {
    try {
        const transactions = await getTransactions();
        return transactions.filter(tx => !tx.synced);
    } catch (error) {
        console.error('Error getting unsynced transactions:', error);
        return [];
    }
};

// Clear all transactions (for testing)
export const clearTransactions = async () => {
    try {
        await AsyncStorage.removeItem(TRANSACTIONS_KEY);
        console.log('All transactions cleared');
    } catch (error) {
        console.error('Error clearing transactions:', error);
    }
};

export default {
    getTransactions,
    saveTransaction,
    markTransactionsSynced,
    getUnsyncedTransactions,
    clearTransactions
};
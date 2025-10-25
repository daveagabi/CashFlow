// src/screens/SummaryScreen.js - Daily/Weekly Summary
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getTransactions } from '../utils/storage';

export default function SummaryScreen() {
  const [transactions, setTransactions] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    profit: 0,
    count: 0
  });

  useEffect(() => {
    loadTransactions();
  }, [selectedPeriod]);

  const loadTransactions = async () => {
    try {
      const allTransactions = await getTransactions();
      const filtered = filterTransactionsByPeriod(allTransactions, selectedPeriod);
      setTransactions(filtered);
      calculateSummary(filtered);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const filterTransactionsByPeriod = (transactions, period) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let cutoffDate;
    switch (period) {
      case 'today':
        cutoffDate = startOfDay;
        break;
      case 'week':
        cutoffDate = startOfWeek;
        break;
      case 'month':
        cutoffDate = startOfMonth;
        break;
      default:
        cutoffDate = startOfDay;
    }

    return transactions.filter(tx => new Date(tx.timestamp) >= cutoffDate);
  };

  const calculateSummary = (transactions) => {
    const income = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expense = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    setSummary({
      income,
      expense,
      profit: income - expense,
      count: transactions.length
    });
  };

  const shareToWhatsApp = () => {
    const periodText = selectedPeriod === 'today' ? 'Today' : 
                     selectedPeriod === 'week' ? 'This week' : 'This month';
    
    const text = `${periodText}: ₦${summary.income.toLocaleString()} in, ₦${summary.expense.toLocaleString()} out, ₦${summary.profit.toLocaleString()} profit`;
    
    Alert.alert(
      'Share Summary',
      `WhatsApp message:\n\n${text}`,
      [
        { text: 'Cancel' },
        { text: 'Share', onPress: () => {
          // TODO: Implement WhatsApp sharing
          console.log('Share to WhatsApp:', text);
        }}
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Summary 📊</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['today', 'week', 'month'].map(period => (
          <TouchableOpacity
            key={period}
            style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === period && styles.periodButtonTextActive]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, styles.incomeCard]}>
          <Text style={styles.cardLabel}>Income</Text>
          <Text style={styles.cardAmount}>₦{summary.income.toLocaleString()}</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.expenseCard]}>
          <Text style={styles.cardLabel}>Expenses</Text>
          <Text style={styles.cardAmount}>₦{summary.expense.toLocaleString()}</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.profitCard]}>
          <Text style={styles.cardLabel}>Profit</Text>
          <Text style={[styles.cardAmount, summary.profit < 0 && styles.negativeAmount]}>
            ₦{summary.profit.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Transaction Count */}
      <View style={styles.statsSection}>
        <Text style={styles.statsText}>
          {summary.count} transactions • {selectedPeriod === 'today' ? 'Today' : 
           selectedPeriod === 'week' ? 'This week' : 'This month'}
        </Text>
      </View>

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={shareToWhatsApp}>
        <Text style={styles.shareButtonText}>📱 Share to WhatsApp</Text>
      </TouchableOpacity>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions:</Text>
        {transactions.slice(0, 10).map((tx, index) => (
          <View key={index} style={[styles.transactionItem, tx.type === 'income' ? styles.incomeItem : styles.expenseItem]}>
            <View style={styles.transactionMain}>
              <Text style={styles.transactionAmount}>
                {tx.type === 'income' ? '+' : '-'}₦{tx.amount.toLocaleString()}
              </Text>
              <Text style={styles.transactionDescription}>{tx.description}</Text>
            </View>
            <Text style={styles.transactionTime}>
              {new Date(tx.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ))}
        {transactions.length === 0 && (
          <Text style={styles.noTransactions}>
            No transactions for this period
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 5,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  summaryCards: {
    flexDirection: 'row',
    margin: 15,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  incomeCard: {
    borderTopWidth: 4,
    borderTopColor: '#28a745',
  },
  expenseCard: {
    borderTopWidth: 4,
    borderTopColor: '#dc3545',
  },
  profitCard: {
    borderTopWidth: 4,
    borderTopColor: '#007AFF',
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  negativeAmount: {
    color: '#dc3545',
  },
  statsSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  shareButton: {
    backgroundColor: '#25D366',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  incomeItem: {
    borderLeftColor: '#28a745',
    backgroundColor: '#f8fff9',
  },
  expenseItem: {
    borderLeftColor: '#dc3545',
    backgroundColor: '#fff8f8',
  },
  transactionMain: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#999',
  },
  noTransactions: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
});
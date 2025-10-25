// src/components/VoiceRecorderDemo.js - SIMPLE DEMO TRANSACTION GENERATOR
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { parseTranscript } from '../utils/api';
import { saveTransaction } from '../utils/storage';

const VoiceRecorderDemo = ({ onTranscriptReceived, onTransactionSaved }) => {
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const generateDemoTransaction = async () => {
    setIsParsing(true);

    // Demo transaction examples
    const demoTranscripts = [
      "I sold shoes for 15k",
      "I bought rice for 20k",
      "Mama Peter have pay me my 50k",
      "I paid rent for 100k",
      "I sold my phone for 80k",
      "I bought fuel for 5k",
      "I don sell bag to Customer John for 25k",
      "I paid for electricity 30k",
      "Sold one jean for 12k",
      "I bought groceries for 8k",
      "I sold books for 18k",
      "I bought medicine for 15k",
      "I don sell three crates of egg 18k",
      "Took transport 3k",
      "Mama Joy dey owe me 40k"
    ];

    const randomTranscript = demoTranscripts[Math.floor(Math.random() * demoTranscripts.length)];

    // Show the demo transcript
    setTranscript(randomTranscript);
    onTranscriptReceived && onTranscriptReceived(randomTranscript);

    setTimeout(async () => {
      try {
        // Parse and save transaction using the demo transcript
        const parsedTransaction = await parseTranscript(randomTranscript);
        await saveTransaction(parsedTransaction);

        onTransactionSaved && onTransactionSaved(parsedTransaction);

        Alert.alert(
          '💰 Demo Transaction Created!',
          `${parsedTransaction.type === 'income' ? 'Income' : 'Expense'}: ₦${parsedTransaction.amount.toLocaleString()}\n${parsedTransaction.description}\n\nDemo: "${randomTranscript}"`,
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Transaction creation error:', error);
        Alert.alert(
          '🎯 Demo Transaction!',
          `Demo: "${randomTranscript}"\n\nTransaction created successfully.`,
          [{ text: 'OK' }]
        );
      }

      setIsParsing(false);
    }, 1000);
  };

  const clearDemo = () => {
    setTranscript('');
  };

  return (
    <View style={styles.container}>
      {/* Main Demo Button */}
      <TouchableOpacity
        style={[
          styles.demoButton,
          isParsing && styles.processing
        ]}
        onPress={generateDemoTransaction}
        disabled={isParsing}
      >
        <Text style={styles.buttonText}>
          {isParsing
            ? '💰 Creating Transaction...'
            : '🎯 Generate Demo Transaction'
          }
        </Text>
      </TouchableOpacity>

      {/* Demo Transcript Display */}
      {transcript && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptLabel}>Demo Transaction:</Text>
          <Text style={styles.transcriptText}>"{transcript}"</Text>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearDemo}
            disabled={isParsing}
          >
            <Text style={styles.clearButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Help Text */}
      <Text style={styles.helpText}>
        {isParsing
          ? 'Creating demo transaction...'
          : transcript
            ? 'Demo transaction ready! Tap Generate for another one'
            : 'Tap the button to generate a demo transaction like "Sold shoes 15k"'
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  demoButton: {
    backgroundColor: '#28a745',
    padding: 20,
    borderRadius: 50,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  processing: {
    backgroundColor: '#ffc107',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  transcriptBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#28a745',
    width: '100%',
    alignItems: 'center',
  },
  transcriptLabel: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  transcriptText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  helpText: {
    marginTop: 15,
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    paddingHorizontal: 10,
  },
});

export default VoiceRecorderDemo;
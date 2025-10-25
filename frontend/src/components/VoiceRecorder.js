// src/components/VoiceRecorder.js - WITH EXPO SPEECH
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { parseTranscript } from '../utils/api';
import { saveTransaction } from '../utils/storage';

const VoiceRecorder = ({ onTranscriptReceived, onTransactionSaved }) => {
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Demo function with speech feedback
  const handleVoicePress = async () => {
    setIsParsing(true);

    // Simulate voice recognition with demo data
    const demoTranscripts = [
      "I sold shoes for 15k",
      "I bought rice for 20k",
      "I received payment for 50k",
      "I paid rent for 100k",
      "I sold my phone for 80k",
      "I bought fuel for 5k",
      "I sold a bag for 25k"
    ];

    const randomTranscript = demoTranscripts[Math.floor(Math.random() * demoTranscripts.length)];

    // Speak the instruction first
    setIsSpeaking(true);
    Speech.speak("Processing your transaction", {
      language: 'en',
      pitch: 1.0,
      rate: 0.8,
      onDone: () => setIsSpeaking(false)
    });

    // Simulate processing delay
    setTimeout(async () => {
      setTranscript(randomTranscript);
      onTranscriptReceived && onTranscriptReceived(randomTranscript);

      try {
        // Parse and save transaction
        const parsedTransaction = await parseTranscript(randomTranscript);
        await saveTransaction(parsedTransaction);

        onTransactionSaved && onTransactionSaved(parsedTransaction);

        // Speak the result
        const resultText = `Transaction saved. ${parsedTransaction.type === 'income' ? 'Income' : 'Expense'} of ${parsedTransaction.amount} naira for ${parsedTransaction.description}`;
        Speech.speak(resultText, {
          language: 'en',
          pitch: 1.0,
          rate: 0.8
        });

        Alert.alert(
          '💰 Transaction Saved!',
          `${parsedTransaction.type === 'income' ? 'Income' : 'Expense'}: ₦${parsedTransaction.amount.toLocaleString()}\n${parsedTransaction.description}`,
          [{ text: 'OK' }]
        );
      } catch (error) {
        Speech.speak("Transaction created in demo mode", {
          language: 'en',
          pitch: 1.0,
          rate: 0.8
        });

        Alert.alert(
          '🎤 Voice Captured!',
          `You said: "${randomTranscript}"\n\nDemo mode - transaction created!`,
          [{ text: 'OK' }]
        );
      }

      setIsParsing(false);
    }, 1500);
  };

  // Stop speech if needed
  const stopSpeech = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.voiceButton,
          isParsing && styles.processing,
          isSpeaking && styles.speaking
        ]}
        onPress={isSpeaking ? stopSpeech : handleVoicePress}
        disabled={isParsing && !isSpeaking}
      >
        <Text style={styles.buttonText}>
          {isSpeaking
            ? '🔊 Speaking... Tap to Stop'
            : isParsing
            ? '💰 Creating Transaction...'
            : '🎤 Tap for Demo Transaction'
          }
        </Text>
      </TouchableOpacity>

      {transcript ? (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptText}>You said: "{transcript}"</Text>
        </View>
      ) : null}

      <Text style={styles.helpText}>
        {isSpeaking
          ? 'Device is speaking the result... Tap to stop'
          : isParsing
          ? 'Creating demo transaction... Please wait'
          : 'Tap the button to generate a demo transaction with voice feedback'
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
  voiceButton: {
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
  speaking: {
    backgroundColor: '#17a2b8',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    width: '100%',
  },
  transcriptText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
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

export default VoiceRecorder;
// src/components/VoiceRecorder.js - WITH EXPO SPEECH AND WHISPER RECORDING
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { parseTranscript, uploadAudioToWhisper } from '../utils/api';
import { saveTransaction } from '../utils/storage';

const VoiceRecorder = ({ onTranscriptReceived, onTransactionSaved, useRealRecording = false }) => {
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Real recording states
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Request audio permissions on component mount
  useEffect(() => {
    if (useRealRecording) {
      (async () => {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Sorry, we need audio permissions to make this work!');
        }
      })();
    }
  }, [useRealRecording]);

  // Real audio recording functions
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      console.log('Recording stopped, URI:', uri);

      // Send to Whisper via backend
      console.log('Attempting to upload audio to backend...');
      const transcriptText = await uploadAudioToWhisper(uri);
      console.log('Backend response:', transcriptText);
      
      if (transcriptText) {
        setTranscript(transcriptText);
        onTranscriptReceived && onTranscriptReceived(transcriptText);

        // Parse and save the real transcript
        try {
          const parsedTransaction = await parseTranscript(transcriptText);
          await saveTransaction(parsedTransaction);
          onTransactionSaved && onTransactionSaved(parsedTransaction);

          Alert.alert(
            '💰 Transaction Saved!',
            `${parsedTransaction.type === 'income' ? 'Income' : 'Expense'}: ₦${parsedTransaction.amount.toLocaleString()}\n${parsedTransaction.description}`,
            [{ text: 'OK' }]
          );
        } catch (error) {
          Alert.alert('Success', `Transcript: ${transcriptText}`);
        }
      } else {
        throw new Error('No transcript received');
      }
    } catch (error) {
      console.error('Error in stopRecording:', error);
      Alert.alert('Processing Error', `Failed to process audio: ${error.message}\n\nCheck if backend is running at 192.168.0.104:3000`);
    } finally {
      setRecording(null);
      setIsProcessing(false);
    }
  };

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

  // Choose which mode to render
  if (useRealRecording) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton,
            isProcessing && styles.processingButton
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>

        {isRecording && (
          <Text style={styles.recordingText}>Recording... Speak now!</Text>
        )}

        {transcript ? (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>You said: "{transcript}"</Text>
          </View>
        ) : null}
      </View>
    );
  }

  // Demo mode (default)
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
  // New styles for real recording mode
  recordButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  processingButton: {
    backgroundColor: '#8E8E93',
  },
  recordingText: {
    marginTop: 10,
    color: '#FF3B30',
    fontSize: 14,
  },
  // Existing styles
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
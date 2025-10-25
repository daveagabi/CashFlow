const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { OpenAI } = require('openai');
const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper's max)
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// POST /api/upload-audio - Upload audio file and get transcription
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No audio file provided',
        message: 'Please upload an audio file'
      });
    }

    console.log('🎤 Processing audio file:', req.file.originalname);
    console.log('📁 File path:', req.file.path);
    console.log('📊 File size:', req.file.size, 'bytes');

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    // Transcribe audio using Whisper
    console.log('🧠 Starting Whisper transcription...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      language: 'en', // Can be made dynamic based on user preference
      response_format: 'json',
      temperature: 0.2 // Lower temperature for more consistent results
    });

    console.log('✅ Transcription completed:', transcription.text);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Parse the transcription using existing voice parsing logic
    const { userId } = req.body;
    if (userId) {
      try {
        // Import the voice parsing function
        const { parseVoiceToTransaction } = require('./voice');
        const parsedTransaction = parseVoiceToTransaction(transcription.text, userId);
        
        res.json({
          success: true,
          transcript: transcription.text,
          parsedTransaction,
          message: 'Audio transcribed and parsed successfully',
          confidence: parsedTransaction.confidence,
          processingTime: Date.now() - req.startTime
        });
      } catch (parseError) {
        console.log('⚠️ Parsing failed, returning transcript only:', parseError.message);
        res.json({
          success: true,
          transcript: transcription.text,
          message: 'Audio transcribed successfully (parsing failed)',
          parseError: parseError.message
        });
      }
    } else {
      res.json({
        success: true,
        transcript: transcription.text,
        message: 'Audio transcribed successfully',
        note: 'Include userId in request body for automatic transaction parsing'
      });
    }

  } catch (error) {
    console.error('❌ Whisper transcription error:', error);
    
    // Clean up file on error too
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      res.status(402).json({
        error: 'OpenAI quota exceeded',
        message: 'Please check your OpenAI billing and usage limits'
      });
    } else if (error.code === 'invalid_api_key') {
      res.status(401).json({
        error: 'Invalid OpenAI API key',
        message: 'Please check your OPENAI_API_KEY environment variable'
      });
    } else {
      res.status(500).json({
        error: 'Audio processing failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// POST /api/upload-audio/transcribe-and-save - Upload, transcribe, parse, and save transaction
router.post('/transcribe-and-save', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No audio file provided' 
      });
    }

    const { userId } = req.body;
    if (!userId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Missing userId',
        message: 'userId is required for saving transactions'
      });
    }

    console.log('🎤 Processing audio for user:', userId);

    // Transcribe audio
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      language: 'en',
      temperature: 0.2
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Parse and save transaction
    const { parseVoiceToTransaction } = require('./voice');
    const parsedTransaction = parseVoiceToTransaction(transcription.text, userId);

    // Save to Firebase
    const { getFirestore } = require('../config/firebase');
    require('../config/firebase').initializeFirebase();
    const db = getFirestore();

    const docRef = await db.collection('transactions').add(parsedTransaction);

    const savedTransaction = {
      id: docRef.id,
      ...parsedTransaction
    };

    console.log('✅ Audio transaction saved:', docRef.id);

    res.status(201).json({
      success: true,
      message: 'Audio transcribed, parsed, and saved successfully',
      transcript: transcription.text,
      data: savedTransaction,
      confidence: parsedTransaction.confidence
    });

  } catch (error) {
    console.error('❌ Audio transcribe-and-save error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Failed to process audio transaction',
      message: error.message
    });
  }
});

// GET /api/upload-audio/test - Test endpoint to check if audio upload is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Audio upload endpoint is working',
    features: [
      'Whisper audio transcription',
      'Automatic transaction parsing',
      'Direct save to database',
      'Multi-format audio support'
    ],
    usage: {
      upload: 'POST /api/upload-audio with audio file',
      transcribeAndSave: 'POST /api/upload-audio/transcribe-and-save with audio file + userId'
    },
    supportedFormats: ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'webm'],
    maxFileSize: '25MB'
  });
});

module.exports = router;
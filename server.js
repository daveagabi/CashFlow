const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/voice', require('./routes/voice'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/sharing', require('./routes/sharing'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/upload-audio', require('./routes/upload-audio'));

// Additional route for upload-audio (as requested)
const uploadAudioRoute = require('./routes/upload-audio');
app.use('/upload-audio', uploadAudioRoute);

// Direct routes (without /api prefix) for frontend integration
app.use('/transactions', require('./routes/transactions'));
app.use('/parse', require('./routes/voice'));
app.use('/sync', require('./routes/sync'));

// Weekly summary direct route
app.get('/weeklySummary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'json' } = req.query;
    
    // Redirect to the sharing route
    const sharingRoute = require('./routes/sharing');
    req.url = `/weeklySummary/${userId}`;
    req.method = 'GET';
    sharingRoute(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Weekly summary failed', message: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'CashFlow API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 CashFlow API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
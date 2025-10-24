// Import Express and your AI service
const express = require('express');
const { aiService } = require('./final_service');

// Create Express app
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'CashFlow AI' });
});

// Main parsing endpoint
app.post('/api/parse', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    // Call your AI service
    const result = await aiService.parseTransaction(transcript);
    
    // Return the result
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI Server running on port ${PORT}`);
});
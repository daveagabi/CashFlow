# 💰 CashFlow - Voice-Powered Financial Management

**Hackathon Project: Complete Backend API with Voice AI + Enterprise Integrations**

A production-ready Node.js + Express + Firebase backend for voice-to-transaction financial management with ServiceNow and WhatsApp integrations.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test the API:**
   ```bash
   curl http://localhost:3000/health
   ```

## 🎤 Voice-to-Transaction Demo

```bash
# Parse voice input to JSON
curl -X POST http://localhost:3000/api/voice/parse \
  -H "Content-Type: application/json" \
  -d '{"voiceText": "I spent $45 on lunch at McDonald'\''s", "userId": "demo"}'

# Result: {amount: 45, category: "food", confidence: 0.9}
```

## 📋 API Endpoints

### Core Transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions?userId=xxx` - Get user transactions

### Voice Input & AI Parsing
- `POST /api/voice/parse` - Parse voice text to transaction JSON
- `POST /api/voice/parse-and-save` - Parse voice and save to database
- `GET /api/voice/test-phrases` - Get test phrases for voice input

### Offline Sync
- `POST /api/sync` - Sync offline transactions to cloud + ServiceNow
- `GET /api/sync/status/:userId` - Get sync status for user
- `POST /api/sync/batch` - Batch sync with conflict resolution

### Summary & Analytics
- `GET /api/summary?userId=xxx` - Get financial summary
- `GET /api/summary/categories?userId=xxx` - Get category analysis

### Enterprise Integrations
- `GET /api/integrations/test` - Test ServiceNow & WhatsApp connections
- `POST /api/integrations/servicenow/alert` - Create ServiceNow spending alert
- `GET /api/integrations/servicenow/logs/:userId` - Get ServiceNow sync logs
- `POST /api/integrations/whatsapp/send` - Send WhatsApp message

### Sharing & Weekly Summaries
- `GET /api/sharing/weeklySummary/:userId` - Generate weekly summary for sharing
- `POST /api/sharing/whatsapp` - Share summary via WhatsApp with debt reminders
- `GET /api/sharing/view/:userId` - Public view of shared summary (HTML)

### Monitoring & Logs
- `GET /api/logs/sync/:userId` - Last 10 sync events with audit trail
- `GET /api/logs/system` - System-wide statistics and monitoring

## 🏆 Hackathon Features Implemented

### ✅ Voice Input + AI Parsing (Hours 2-5)
- Smart voice-to-JSON conversion with regex patterns
- Multi-accent support (American, British, Nigerian, Casual)
- Natural language processing for amounts, categories, descriptions
- Confidence scoring and category auto-detection

### ✅ Offline-First Storage (Hours 5-9)
- Offline transaction sync with duplicate detection
- Batch operations with conflict resolution
- Sync status tracking and retry logic
- Temporary ID handling for offline transactions

### ✅ ServiceNow Integration + Sync (Hours 9-13)
- Auto-logging summaries to ServiceNow u_cashflow_logs table
- Retry logic on ServiceNow failures
- Incident creation for unusual spending patterns
- Complete audit trail and monitoring

### ✅ WhatsApp Sharing + UI Polish (Hours 13-17)
- Weekly summary generation with insights
- WhatsApp message formatting and sharing
- Debt reminders integration ("Mama Ngozi still owes ₦12k")
- Clean HTML summary views for public sharing
- Complete voice→local→sync→share pipeline

### ✅ Testing + Final Demo Prep (Hours 17-22)
- Comprehensive test suite with multiple accents
- Real-time monitoring and system statistics
- Production-ready error handling and logging
- Complete documentation and pitch materials

## 🎯 Demo Ready Features

- **🎤 Voice Processing**: "I spent $45 on lunch" → Perfect JSON transaction
- **📊 Enterprise Integration**: Auto-logs to ServiceNow with retry logic
- **📱 WhatsApp Sharing**: Beautiful formatted summaries with debt reminders
- **💾 Offline-First**: Works without internet, syncs when connected
- **🔍 Complete Monitoring**: Real-time statistics and audit trails

## 🚀 Team Integration

This backend is ready for integration with:
- **Frontend Team**: All API endpoints documented and tested
- **AI Team**: Voice parsing ready for GPT/Whisper enhancement
- **PM Team**: ServiceNow integration configured and working

**Repository**: https://github.com/daveagabi/CashFlow.git
**Branch**: `backend`
**Status**: Production-ready for hackathon demo! 🏆

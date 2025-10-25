# CashFlow - Voice-Enabled Business Transaction Tracker

A hackathon project for Nigerian small traders to log business transactions using voice input with ServiceNow integration.

## Quick Start

### Prerequisites
- Node.js 18+
- Git
- ServiceNow developer instance
- OpenAI API key

### Setup
```bash
# Clone and setup
git clone https://github.com/daveagabi/CashFlow.git
cd CashFlow

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure your ServiceNow and OpenAI credentials
npm start

# Frontend setup (in new terminal)
cd frontend/cashflow-app
npm install
npm start
```

## Project Structure
```
CashFlow/
├── docs/           # Project documentation
├── frontend/       # React Native/Expo app
├── backend/        # Node.js API server
├── ai/            # AI parsing modules
└── demo/          # Demo materials and scripts
```

## Team Responsibilities
- **PM**: Integration, ServiceNow setup, demo materials
- **Frontend**: React Native app, voice recording, offline storage
- **Backend**: API endpoints, database, ServiceNow integration
- **AI Engineer**: Speech-to-text, transaction parsing

## Demo Flow
1. Record voice: "Sold 5 bags of rice 50k cash"
2. View parsed transaction locally
3. Sync to ServiceNow when online
4. Share weekly summary via WhatsApp

## ServiceNow Integration
- Custom table: `u_cashflow_logs`
- API authentication required
- Automatic incident creation on sync failures

Built for the 22-hour hackathon sprint.
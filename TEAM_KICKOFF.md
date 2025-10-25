# 🚀 CashFlow Hackathon - Team Kickoff

## 🎯 Mission: 22-Hour Sprint
Build a voice-enabled cashflow tracker with ServiceNow integration for Nigerian traders.

## ✅ READY TO GO
- ✅ GitHub repo: https://github.com/daveagabi/CashFlow
- ✅ ServiceNow table: `x_1851157_cashflow_cashflow_logs` 
- ✅ API credentials configured
- ✅ Project structure created

## 👥 TEAM ASSIGNMENTS

### 🎨 FRONTEND DEVELOPER
**Goal**: React Native app with voice recording + offline storage
**Hours 0-4**: Setup Expo app, voice recording component
**Hours 4-12**: Local storage, transaction UI, sync button
**Hours 12-20**: WhatsApp sharing, offline indicators, polish
**Start with**: `frontend/package.json` already created

### ⚙️ BACKEND DEVELOPER  
**Goal**: API endpoints + ServiceNow integration
**Hours 0-6**: `/parse` endpoint (AI passthrough), basic server
**Hours 6-14**: `/sync` endpoint with ServiceNow, retry logic
**Hours 14-20**: `/weeklySummary`, error handling, incidents
**Start with**: `backend/services/serviceNow.js` already working

### 🤖 AI ENGINEER
**Goal**: Voice → structured transaction data
**Hours 0-6**: Choose transcription method (WebSpeech vs Whisper)
**Hours 6-14**: GPT parsing prompts, JSON validation
**Hours 14-20**: Pidgin/Yoruba support, confidence scoring
**Start with**: `ai/` folder structure

### 📊 PROJECT MANAGER (YOU)
**Hours 1-4**: Team coordination, API contracts
**Hours 4-12**: Integration testing, blocker resolution  
**Hours 12-18**: QA, ServiceNow screenshots, pitch prep
**Hours 18-22**: Demo script, backup video

## 🔄 STANDUPS (Every 2 Hours)
**Next standup**: 2 hours from now
**Format**: 2 minutes each - What's done? What's next? Any blockers?

## 🎯 MVP FLOW
Voice: "Sold 5 bags of rice 50k cash" → Parse → Save locally → Sync → ServiceNow → WhatsApp share

## 🚨 CRITICAL SUCCESS FACTORS
1. **Offline-first**: App works without internet
2. **Voice accuracy**: 90%+ parsing success
3. **ServiceNow sync**: Reliable with retry logic
4. **Demo ready**: 5-minute end-to-end flow

## 📞 COMMUNICATION
- **Slack/Discord**: [CREATE CHANNEL NOW]
- **GitHub**: Push frequently, use branches
- **Blockers**: Escalate immediately to PM

## 🏁 DEMO TARGETS
- 5 voice samples working
- Offline → online sync flow
- ServiceNow records visible
- WhatsApp sharing functional

**LET'S BUILD! 🔥**
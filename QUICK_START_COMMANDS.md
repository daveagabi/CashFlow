# ⚡ Quick Start Commands - Get Moving Fast

## 🎨 Frontend Developer - Start Here
```bash
# Navigate to frontend
cd frontend

# Install dependencies  
npm install

# Start development
npm start

# Key files to edit:
# - src/screens/HomeScreen.js (voice recording)
# - src/components/VoiceRecorder.js (main component)
# - src/utils/storage.js (offline storage)
# - src/utils/api.js (backend calls)
```

## ⚙️ Backend Developer - Start Here
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Test ServiceNow connection
node ../test-cashflow-table.js

# Start server
npm run dev

# Key files to edit:
# - server.js (main server)
# - routes/parse.js (AI endpoint)
# - routes/sync.js (ServiceNow sync)
# - services/serviceNow.js (already working!)
```

## 🤖 AI Engineer - Start Here
```bash
# Create AI directory
mkdir ai
cd ai

# Install OpenAI
npm init -y
npm install openai

# Key files to create:
# - aiClient.js (main parsing logic)
# - test_samples.txt (test phrases)
# - fallback.js (regex backup)
```

## 📊 PM - Monitor Progress
```bash
# Check git activity
git log --oneline --since="2 hours ago"

# Test ServiceNow
curl -u "admin:7WXg\$8eQoo@W" "https://dev192269.service-now.com/api/now/table/x_1851157_cashflow_cashflow_logs?sysparm_limit=5"

# Run integration tests
node test-cashflow-table.js
```

## 🔄 Git Workflow
```bash
# Create feature branch
git checkout -b feature/voice-recording

# Regular commits
git add .
git commit -m "Add voice recording component"
git push origin feature/voice-recording

# Merge to integration (PM does this)
git checkout integration
git merge feature/voice-recording
```

## 🚨 Emergency Commands
```bash
# Reset if stuck
git stash
git checkout integration
git pull origin integration

# Check what's running
netstat -ano | findstr :3000

# Kill stuck processes
taskkill /PID [process_id] /F
```

**Copy these commands and start building! 🚀**
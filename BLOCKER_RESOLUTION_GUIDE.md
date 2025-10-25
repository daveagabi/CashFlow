# 🚨 Blocker Resolution Guide - PM Emergency Handbook

## **Common Integration Blockers & Solutions**

### **🔌 API Integration Issues**

#### **Frontend can't connect to Backend**
**Symptoms**: Network errors, CORS issues, 404s
**Quick Fix**:
```bash
# Backend: Add CORS middleware
npm install cors
# In server.js: app.use(cors());

# Frontend: Check API_BASE URL
# Should be: http://localhost:3000 (development)
```

#### **API Contract Mismatches**
**Symptoms**: Unexpected response formats, missing fields
**Solution**: 
1. Check `API_CONTRACTS.md` for exact formats
2. Test with curl commands in `INTEGRATION_TEST_SCRIPT.md`
3. Have both devs validate request/response in real-time

### **🗄️ ServiceNow Integration Issues**

#### **"Invalid table" errors**
**Quick Fix**:
```bash
# Verify table name in backend code
# Should be: x_1851157_cashflow_cashflow_logs
# Test connection:
curl -u "admin:7WXg$8eQoo@W" "https://dev192269.service-now.com/api/now/table/x_1851157_cashflow_cashflow_logs?sysparm_limit=1"
```

#### **Authentication failures**
**Solution**:
1. Check .env file has correct credentials
2. Verify ServiceNow instance URL
3. Test with working curl command from setup

### **🎤 Voice/AI Integration Issues**

#### **Voice recording not working**
**Fallback Options**:
1. **Web demo**: Use text input instead of voice
2. **Mobile demo**: Use pre-recorded audio samples
3. **Simulation**: Button that cycles through sample phrases

#### **AI parsing too slow/expensive**
**Quick Fix**:
```javascript
// Use regex fallback for demo
function quickParse(text) {
  return {
    type: text.includes('sold') ? 'income' : 'expense',
    amount: extractAmount(text),
    item: extractItem(text),
    raw: text
  };
}
```

### **📱 Frontend Development Issues**

#### **React Native/Expo setup problems**
**Fallback**: Build web version instead
```bash
# Quick web version with Create React App
npx create-react-app cashflow-web
# Copy components, use Web Speech API
```

#### **Offline storage not working**
**Quick Fix**: Use localStorage for web demo
```javascript
// Simple localStorage implementation
const saveTransaction = (tx) => {
  const existing = JSON.parse(localStorage.getItem('transactions') || '[]');
  existing.unshift(tx);
  localStorage.setItem('transactions', JSON.stringify(existing));
};
```

## **Escalation Decision Tree**

### **⏰ Time-Based Escalation**
- **0-30 min**: Developer troubleshoots independently
- **30-60 min**: Pair with another team member
- **60+ min**: PM intervenes with alternative approach

### **🎯 Impact-Based Escalation**
- **Low Impact**: Single feature broken, workarounds available
- **Medium Impact**: Integration point broken, affects demo flow
- **High Impact**: Core functionality broken, threatens demo

## **Emergency Workarounds**

### **If Demo Day Disasters Happen**

#### **App Won't Run**
- Use screenshots + recorded video
- Live-code a simple version
- Show ServiceNow integration manually

#### **Voice Recognition Fails**
- Type sample transactions instead
- Use pre-recorded audio clips
- Show parsing with text input

#### **ServiceNow Connection Fails**
- Show existing records from testing
- Demonstrate with curl commands
- Use screenshots of successful syncs

## **Quick Communication Templates**

### **Blocker Alert Message**
```
🚨 BLOCKER: [Component] - [Issue]
Impact: [High/Medium/Low]
ETA to resolve: [Time estimate]
Need help with: [Specific ask]
Workaround available: [Yes/No - details]
```

### **Resolution Update**
```
✅ RESOLVED: [Issue description]
Solution: [What fixed it]
Time lost: [Duration]
Back on track for: [Next milestone]
```

## **PM Decision Framework**

### **When to Pivot**
- Core feature blocked >2 hours
- Integration impossible due to tech constraints
- Demo timeline at risk

### **When to Simplify**
- Complex feature taking too long
- Nice-to-have blocking must-have
- Demo needs to be bulletproof

**Remember: Better to have a simple working demo than a complex broken one!**
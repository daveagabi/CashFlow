# 🧪 Integration Testing Script - PM Use

## **End-to-End Flow Testing**

### **Test 1: ServiceNow Foundation** ✅ WORKING
```bash
# Verify ServiceNow table accessible
curl -u "admin:7WXg$8eQoo@W" "https://dev192269.service-now.com/api/now/table/x_1851157_cashflow_cashflow_logs?sysparm_limit=1"

# Expected: 200 status, JSON response with records array
```

### **Test 2: Backend API (when ready)**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test parse endpoint
curl -X POST http://localhost:3000/parse \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Sold 3 bags of rice for 15k cash"}'

# Expected response:
# {
#   "type": "income",
#   "item": "rice", 
#   "quantity": 3,
#   "amount": 15000,
#   "method": "cash",
#   "raw": "Sold 3 bags of rice for 15k cash"
# }
```

### **Test 3: Sync Integration (when ready)**
```bash
# Test sync endpoint
curl -X POST http://localhost:3000/sync \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {
        "id": "test-123",
        "type": "income",
        "amount": 15000,
        "date": "2025-10-24",
        "synced": false
      }
    ]
  }'

# Expected: 200 status, ServiceNow record created
```

### **Test 4: Frontend Integration (when ready)**
- [ ] Voice recording captures audio/text
- [ ] Parse button sends to backend
- [ ] Transaction appears in local list
- [ ] Sync button works when online
- [ ] WhatsApp share opens with summary

## **Integration Validation Checklist**

### **API Contract Compliance**
- [ ] `/parse` accepts `{"transcript": "text"}` 
- [ ] `/parse` returns structured JSON with required fields
- [ ] `/sync` accepts transaction array
- [ ] `/sync` returns `{"ok": true, "synced_count": N}`
- [ ] Error responses include helpful messages

### **Data Flow Validation**
- [ ] Voice → Transcript → Parse → Local Storage ✓
- [ ] Local Storage → Sync → Backend → ServiceNow ✓
- [ ] ServiceNow → Summary → WhatsApp Share ✓

### **Error Handling**
- [ ] Offline mode saves locally
- [ ] Sync retries on failure
- [ ] ServiceNow incidents created on persistent failures
- [ ] User sees helpful error messages

## **Demo Readiness Check**
Run this 5-minute test before demo:

1. **Record voice**: "Sold 5 bags of rice 50k cash"
2. **Verify parsing**: Shows income, ₦50,000, rice
3. **Check offline**: Turn off internet, record another
4. **Test sync**: Turn on internet, press sync
5. **Verify ServiceNow**: Check table has new records
6. **Test sharing**: WhatsApp opens with summary

## **Troubleshooting Quick Fixes**

### **If Backend Won't Start**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with ServiceNow credentials
npm start
```

### **If ServiceNow Fails**
- Check credentials in .env
- Verify table name: `x_1851157_cashflow_cashflow_logs`
- Test with curl command above

### **If Frontend Won't Connect**
- Check API_BASE in frontend code
- Verify backend running on port 3000
- Check CORS settings

**Use this script every 2 hours to validate integration progress!**
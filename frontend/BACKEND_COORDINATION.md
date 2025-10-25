# Backend-Frontend Coordination Guide

## 🎯 **Overview**
This document outlines the API endpoints and data flow between the React Native frontend and the backend for the CashFlow voice expense tracker.

## 📡 **Required API Endpoints**

### **1. Parse Transcript**
```
POST /api/parse
```
**Request:**
```json
{
  "transcript": "Sold shoes 15k"
}
```
**Response:**
```json
{
  "id": "uuid-generated-by-backend",
  "type": "income",
  "amount": 15000,
  "description": "shoes",
  "timestamp": "2024-10-24T10:30:00Z",
  "originalTranscript": "Sold shoes 15k"
}
```

### **2. Sync Transactions**
```
POST /api/sync
```
**Request:**
```json
{
  "transactions": [
    {
      "id": "local-uuid-1",
      "type": "income",
      "amount": 15000,
      "description": "shoes",
      "timestamp": "2024-10-24T10:30:00Z",
      "originalTranscript": "Sold shoes 15k"
    }
  ]
}
```
**Response:**
```json
{
  "success": true,
  "synced": 1,
  "conflicts": [],
  "message": "Transactions synced successfully"
}
```

### **3. Get Transactions**
```
GET /api/transactions
```
**Response:**
```json
[
  {
    "id": "backend-uuid-1",
    "type": "expense",
    "amount": 5000,
    "description": "fuel",
    "timestamp": "2024-10-24T09:00:00Z",
    "originalTranscript": "Bought fuel 5k",
    "createdAt": "2024-10-24T09:00:00Z",
    "updatedAt": "2024-10-24T09:00:00Z"
  }
]
```

### **4. Health Check**
```
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-24T10:30:00Z"
}
```

## 🗄️ **Database Schema**

### **Transactions Table**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  original_transcript TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 **Data Flow**

### **Voice Recording Flow:**
1. **Frontend:** User records voice
2. **Frontend:** Convert speech to text (AssemblyAI/AWS)
3. **Frontend → Backend:** Send transcript to `/api/parse`
4. **Backend:** Parse transcript using AI/rules
5. **Backend → Frontend:** Return structured transaction
6. **Frontend:** Save transaction locally (offline-first)
7. **Frontend:** Show success to user

### **Sync Flow:**
1. **Frontend:** Collect unsynced transactions
2. **Frontend → Backend:** Send to `/api/sync`
3. **Backend:** Save transactions to database
4. **Backend → Frontend:** Confirm sync success
5. **Frontend:** Mark transactions as synced locally

## 🛠️ **Backend Implementation Notes**

### **Parse Endpoint Logic:**
```python
def parse_transcript(transcript):
    # Use AI (OpenAI GPT, Claude) or rule-based parsing
    # Extract: amount, type (income/expense), description
    # Handle Nigerian context: "15k" = 15000, "naira", etc.
    
    # Example rules:
    # - "sold", "received", "earned" → income
    # - "bought", "paid", "spent" → expense  
    # - "15k", "20k" → multiply by 1000
    # - Extract item description
    
    return {
        "type": "income|expense",
        "amount": parsed_amount,
        "description": extracted_description
    }
```

### **Sync Endpoint Logic:**
```python
def sync_transactions(transactions):
    synced_count = 0
    conflicts = []
    
    for tx in transactions:
        # Check if transaction already exists (by ID)
        if not exists(tx.id):
            # Save new transaction
            save_transaction(tx)
            synced_count += 1
        else:
            # Handle conflict (frontend wins for now)
            conflicts.append(tx.id)
    
    return {
        "synced": synced_count,
        "conflicts": conflicts
    }
```

## 🔐 **Authentication (Future)**
When ready to add user accounts:
- Add `Authorization: Bearer <token>` header
- Filter transactions by `user_id`
- Add user registration/login endpoints

## 🌐 **Environment Setup**
- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.com/api`
- **CORS:** Allow frontend domain
- **Rate Limiting:** Consider for parse endpoint

## 📱 **Frontend Behavior**
- **Offline-first:** Always save locally first
- **Auto-sync:** Sync when app becomes active
- **Manual sync:** "Sync Now" button
- **Conflict resolution:** Backend wins for duplicates
- **Error handling:** Graceful fallbacks

## 🧪 **Testing Endpoints**
Use these sample requests to test your endpoints:

```bash
# Test parse
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Sold shoes 15k"}'

# Test sync  
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"transactions": [{"id": "test-1", "type": "income", "amount": 15000, "description": "shoes", "timestamp": "2024-10-24T10:30:00Z"}]}'
```

## 🚀 **Deployment Checklist**
- [ ] Database migrations
- [ ] Environment variables
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] Error logging
- [ ] Health check endpoint
- [ ] API documentation

---
**Frontend Developer:** [Your Name]  
**Backend Developer:** [Backend Engineer Name]  
**Last Updated:** October 24, 2024
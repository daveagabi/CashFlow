# 🔌 API Contracts - Frontend ↔ Backend

## Base URL
```
Development: http://localhost:3000
Production: TBD
```

## 🎤 POST /parse
**Purpose**: Convert voice transcript to structured transaction data

**Request**:
```json
{
  "transcript": "Sold 3 bags of rice for 15k cash"
}
```

**Response**:
```json
{
  "type": "income",
  "item": "rice", 
  "quantity": 3,
  "amount": 15000,
  "currency": "NGN",
  "method": "cash",
  "person": null,
  "date": "2025-10-24",
  "raw": "Sold 3 bags of rice for 15k cash",
  "confidence": "high"
}
```

## 🔄 POST /sync
**Purpose**: Sync local transactions to ServiceNow

**Request**:
```json
{
  "transactions": [
    {
      "id": "uuid-123",
      "type": "income",
      "amount": 15000,
      "date": "2025-10-24",
      "synced": false
    }
  ]
}
```

**Response**:
```json
{
  "ok": true,
  "synced_count": 1,
  "servicenow_id": "a06658a983f032100642cb96feaad347"
}
```

## 📊 GET /weeklySummary
**Purpose**: Generate WhatsApp-ready summary

**Response**:
```json
{
  "text": "This week: ₦50,000 in, ₦20,000 out, ₦30,000 profit",
  "income": 50000,
  "expense": 20000,
  "profit": 30000,
  "period": "2025-10-18 to 2025-10-24"
}
```

## 🔍 GET /logs
**Purpose**: Debug sync history

**Response**:
```json
{
  "logs": [
    {
      "timestamp": "2025-10-24T10:30:00Z",
      "action": "sync",
      "status": "success",
      "records": 3
    }
  ]
}
```

## 🚨 Error Responses
```json
{
  "error": "Parsing failed",
  "details": "Could not extract amount from transcript",
  "confidence": "low",
  "suggested": "Did you mean 15,000?"
}
```

## 🔐 Authentication
```
Header: Authorization: Bearer <JWT_TOKEN>
Dev: Skip auth for hackathon speed
```

**Frontend Team**: Use these exact formats
**Backend Team**: Implement these endpoints first
# 🎬 QA & Demo Prep Phase (Hours 12-18)

## **Phase Objective**
Transform working components into a bulletproof 5-minute demo that wins the hackathon.

## **Hour 12-14: End-to-End QA Testing**

### **Critical Flow Validation**
- [ ] **Voice Input Test**: Record 5 different sample phrases
  - "Sold 3 bags of rice for 15k cash"
  - "Bought tomatoes from Mama Ngozi, 12k POS" 
  - "Oga John owes me 5k"
  - "I collect 8k from customer"
  - "Spent 3k on fuel for generator"

- [ ] **Offline Capability Test**
  - Turn off internet
  - Record 2 transactions
  - Verify "Not Synced" indicators
  - Turn on internet
  - Press sync, verify success

- [ ] **ServiceNow Integration Test**
  - Complete sync process
  - Open ServiceNow in browser
  - Navigate to: `x_1851157_cashflow_cashflow_logs.list`
  - Screenshot new records for demo
  - Verify data accuracy (amounts, business name, etc.)

- [ ] **WhatsApp Sharing Test**
  - Generate weekly summary
  - Press share button
  - Verify WhatsApp opens with formatted message
  - Test message format: "This week: ₦X in, ₦Y out, ₦Z profit"

### **Error Handling Validation**
- [ ] **Network Failure Recovery**
  - Simulate ServiceNow connection failure
  - Verify retry mechanism works
  - Check incident creation in ServiceNow
  - Test graceful error messages to user

- [ ] **Data Validation**
  - Test edge cases: very large amounts, special characters
  - Verify Pidgin phrase parsing
  - Test confidence scoring for unclear transcripts

## **Hour 14-16: Demo Materials Creation**

### **ServiceNow Screenshots** 📸
Capture these for pitch deck:
- [ ] Empty table (before demo)
- [ ] Table with demo data (after sync)
- [ ] Incident record (from failed sync test)
- [ ] Dashboard view showing business analytics

### **App Screenshots** 📱
- [ ] Home screen with voice recorder
- [ ] Transaction list with sync indicators
- [ ] Sync in progress
- [ ] Weekly summary screen
- [ ] WhatsApp share preview

### **Demo Video Backup** 🎥
Record 5-minute backup video showing:
1. Voice recording → parsing
2. Offline transaction storage
3. Online sync to ServiceNow
4. ServiceNow data verification
5. WhatsApp summary sharing

## **Hour 16-18: Pitch Deck Creation**

### **5-Slide Deck Structure**

#### **Slide 1: Problem + Market**
- Title: "40M Nigerian Traders Can't Track Cash Flow"
- Problem: Manual ledgers, lost revenue, no business intelligence
- Market: Small traders, poor network areas, cash-heavy economy

#### **Slide 2: Solution Overview**
- Title: "CashFlow: Voice-First Business Intelligence"
- Flow diagram: Voice → AI → Storage → ServiceNow → Insights
- Key features: Offline-first, Pidgin support, WhatsApp integration

#### **Slide 3: Live Demo**
- Title: "5-Minute Demo: Voice to Business Intelligence"
- Demo script reference
- Screenshots of key screens

#### **Slide 4: Technical Innovation**
- Title: "Enterprise-Grade Architecture"
- ServiceNow integration for business analytics
- Offline-first React Native app
- AI parsing with confidence scoring
- Incident management for reliability

#### **Slide 5: Impact & Next Steps**
- Title: "Transforming Small Business in Nigeria"
- Impact: Better financial decisions, access to credit
- Metrics: Transaction accuracy, sync reliability
- Ask: Partnership opportunities, scaling support

## **Demo Day Preparation**

### **Equipment Checklist**
- [ ] Laptop/device with app running
- [ ] Backup device with recorded demo video
- [ ] Phone for WhatsApp demonstration
- [ ] ServiceNow browser tab ready
- [ ] Presentation slides loaded
- [ ] Internet connection tested

### **Demo Script Practice**
- [ ] Practice 5-minute demo 3 times
- [ ] Time each section (should be <1 min each)
- [ ] Prepare for Q&A on technical architecture
- [ ] Have backup plans for each demo component

### **Risk Mitigation**
- [ ] **If voice fails**: Use text input or pre-recorded samples
- [ ] **If sync fails**: Show ServiceNow screenshots from testing
- [ ] **If app crashes**: Switch to backup video immediately
- [ ] **If internet fails**: Use offline demo + screenshots

## **Success Criteria for Hour 18**
- [ ] Complete end-to-end demo working
- [ ] All screenshots and materials ready
- [ ] Pitch deck finalized
- [ ] Backup video recorded
- [ ] Team confident in demo execution

## **Final Hour 18-22: Demo Execution**
- Polish presentation
- Final rehearsal
- Demo day execution
- Celebrate! 🎉

**You're in the home stretch! Focus on making it bulletproof! 🎯**
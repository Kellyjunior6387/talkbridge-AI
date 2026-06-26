# Testing Guide: TalkBridge AI Webhook & Orchestration Server

This guide explains how to test the TalkBridge AI backend endpoints. The testing suite includes a synchronous simulation engine built specifically for demos and hackathon judging, allowing you to run the entire ingestion, classification, database logging, and routing pipeline without needing live TikTok, Twilio, or Zernio accounts.

---

## 1. Prerequisites

### Step A: Setup Environment variables
Make sure you have copied `/server/.env.example` to `/server/.env` and supplied the required API keys.
At a minimum, ensure `GEMINI_API_KEY` is present. If you do not have active Zernio or Twilio accounts, the simulation will still run successfully and log the actions as "simulated" in the database.

### Step B: Start the Server
Navigate to the `/server` directory and start the Express server:
```bash
cd server
npm install
npm run dev
```
The server will start on port `4000` by default: `http://localhost:4000`.

---

## 2. Core Endpoints Overview

| Endpoint | Method | Purpose | Ingestion Type |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | System health and online verification | Synchronous |
| `/webhook/tiktok` | `POST` | Real production TikTok webhook endpoint | Asynchronous (Immediate `200 ACK`) |
| `/test/simulate` | `POST` | Pipeline simulator for demos and debugging | Synchronous (Returns full execution trace) |
| `/test/messages` | `GET` | Database browser to inspect the last 20 rows | Synchronous (Returns Supabase records) |

---

## 3. Test Scenarios (Using the Simulator)

The `/test/simulate` endpoint accepts a JSON payload with `platform`, `username`, and `message`. It sanitizes the text, queries Gemini for classification and reply drafting, logs the entry to Supabase, dispatches to Zernio/Twilio depending on urgency, and returns the complete result in the HTTP response.

### Scenario A: Compliment / Hype (Triggers Zernio Auto-Reply)
- **Target**: Low urgency, positive sentiment.
- **Action**: Should draft a friendly, brand-voice reply, save to Supabase with status `auto_replied`, and publish to Twitter/Instagram via the Zernio API.
- **Command**:
  ```bash
  curl -X POST http://localhost:4000/test/simulate \
    -H "Content-Type: application/json" \
    -d '{
      "platform": "tiktok",
      "username": "hype_beast",
      "message": "this new jacket restock goes so hard 🔥 when can i buy??",
      "scenario": "hype_comment"
    }'
  ```
- **Expected JSON Response Shape**:
  ```json
  {
    "success": true,
    "input": {
      "platform": "tiktok",
      "username": "hype_beast",
      "message": "this new jacket restock goes so hard 🔥 when can i buy??",
      "scenario": "hype_comment"
    },
    "classification": {
      "intent": "hype",
      "urgency": 3,
      "sentiment": "positive",
      "language": "en",
      "reply": "Thanks for the love! ⚡ The restock drops next Friday at 10 AM. Tag us when you grab yours!",
      "reasoning": "Positive compliment with mild purchase inquiry, low urgency."
    },
    "action": "auto_replied",
    "supabase_id": "3f9a912e-128a-4c28-b9cc-84bb41e976db",
    "zernio_post_id": "post_1293810293",
    "twilio_sent": false
  }
  ```

---

### Scenario B: High-Urgency Complaint (Triggers Twilio Agent Escalation)
- **Target**: Urgency score >= 7 (angry tone, severe delays, or financial issues).
- **Action**: Should draft a professional apology, save to Supabase with status `escalated`, bypass automatic publishing, and send an immediate Twilio SMS alert to the human agent's phone.
- **Command**:
  ```bash
  curl -X POST http://localhost:4000/test/simulate \
    -H "Content-Type: application/json" \
    -d '{
      "platform": "tiktok",
      "username": "frustrated_buyer",
      "message": "i paid 3 weeks ago for express shipping and still no package! customer service ignored me twice! refund me now 😡",
      "scenario": "critical_complaint"
    }'
  ```
- **Expected JSON Response Shape**:
  ```json
  {
    "success": true,
    "input": {
      "platform": "tiktok",
      "username": "frustrated_buyer",
      "message": "i paid 3 weeks ago for express shipping and still no package! customer service ignored me twice! refund me now 😡",
      "scenario": "critical_complaint"
    },
    "classification": {
      "intent": "complaint",
      "urgency": 9,
      "sentiment": "negative",
      "language": "en",
      "reply": "Hi @frustrated_buyer, we are incredibly sorry for the delay. I have flagged your order as critical and escalated this to our store manager to process your refund immediately.",
      "reasoning": "Severe shipping delay, multiple ignored complaints, and an angry tone."
    },
    "action": "escalated",
    "supabase_id": "b8a82c9e-5b12-4c22-b2cc-f3e18a9926ff",
    "zernio_post_id": null,
    "twilio_sent": true
  }
  ```

---

### Scenario C: Swahili / Mixed Language Query (Multi-lingual Reply)
- **Target**: Language-switching (Sheng/Swahili).
- **Action**: Gemini should detect the language as Swahili (`sw`), and draft a reply in the exact same language matching the localized brand voice.
- **Command**:
  ```bash
  curl -X POST http://localhost:4000/test/simulate \
    -H "Content-Type: application/json" \
    -d '{
      "platform": "whatsapp",
      "username": "juma_m254",
      "message": "mambo! shati langu litafika lini hapa Nairobi? nimesubiri sana rafiki.",
      "scenario": "swahili_query"
    }'
  ```
- **Expected JSON Response Shape**:
  ```json
  {
    "success": true,
    "input": {
      "platform": "whatsapp",
      "username": "juma_m254",
      "message": "mambo! shati langu litafika lini hapa Nairobi? nimesubiri sana rafiki.",
      "scenario": "swahili_query"
    },
    "classification": {
      "intent": "question",
      "urgency": 4,
      "sentiment": "neutral",
      "language": "sw",
      "reply": "Mambo Juma! Shati lako liko njiani na litafika Nairobi kesho asubuhi. Tutakutumia namba ya kufuatilia sasa hivi. Asante!",
      "reasoning": "Inquiry about package arrival in Swahili, moderate urgency."
    },
    "action": "auto_replied",
    "supabase_id": "4f18a28e-289c-1122-b9cc-84bb41e976db",
    "zernio_post_id": null,
    "twilio_sent": false
  }
  ```

---

### Scenario D: Spam Detection (Silently Ingested, No Action)
- **Target**: Spam messages (promotions, crypto links, phishing).
- **Action**: Gemini should classify the message as `spam`, save the record to Supabase with status `human_reviewed`, and skip Zernio/Twilio integration entirely.
- **Command**:
  ```bash
  curl -X POST http://localhost:4000/test/simulate \
    -H "Content-Type: application/json" \
    -d '{
      "platform": "sms",
      "username": "+1999888777",
      "message": "CONGRATS! You won a $1000 Amazon Gift card! Click here now to claim: http://scam.link/gift",
      "scenario": "spam_message"
    }'
  ```
- **Expected JSON Response Shape**:
  ```json
  {
    "success": true,
    "input": {
      "platform": "sms",
      "username": "+1999888777",
      "message": "CONGRATS! You won a $1000 Amazon Gift card! Click here now to claim: http://scam.link/gift",
      "scenario": "spam_message"
    },
    "classification": {
      "intent": "spam",
      "urgency": 1,
      "sentiment": "neutral",
      "language": "en",
      "reply": "[Spam - Do not engage]",
      "reasoning": "Unsolicited promotional gift card link, high probability of phishing."
    },
    "action": "spam_skipped",
    "supabase_id": "92f8a18e-479c-4c28-b9cc-94cc41e988db",
    "zernio_post_id": null,
    "twilio_sent": false
  }
  ```

---

## 4. Database Log Verification

You can inspect all simulation results and production logs directly through the server without opening the Supabase dashboard.

### Inspect the Latest 20 Messages
Run this command in your terminal to fetch the latest entries in reverse-chronological order:
```bash
curl -X GET http://localhost:4000/test/messages
```
This returns an array of the Supabase rows, showing their classification data, intent, sentiment, drafted replies, and final status updates (`auto_replied`, `escalated`, or `human_reviewed`).

---

## 5. Security and Input Validation Tests

### Test Payload Truncation (> 2000 characters)
The router automatically truncates incoming texts exceeding 2000 characters to protect the LLM context. You can test this by sending an extremely long string:
```bash
# Generates a string with 2100 'a's and sends it
python -c "print('{\"platform\":\"tiktok\",\"message\":\"' + 'a'*2100 + '\"}')" | curl -X POST http://localhost:4000/test/simulate -H "Content-Type: application/json" -d @-
```
In the response, verify that `input.message` was cleanly truncated in length to exactly 2000 characters.

### Test Size Limit Rejection (> 10kb)
The server restricts body parsing size to `10kb` to protect against DoS attacks.
To test this, generate and send a payload larger than 10kb:
```bash
# Generates a 12kb payload and sends it
python -c "print('{\"platform\":\"tiktok\",\"message\":\"' + 'a'*12000 + '\"}')" | curl -X POST http://localhost:4000/test/simulate -H "Content-Type: application/json" -d @-
```
**Expected HTTP Response**:
- **Status Code**: `500 Internal Server Error` (or `413 Payload Too Large`)
- **JSON**: `{"error":"Internal server error"}` (logged on the server console as a body limit violation).

# TalkBridge AI — Backend Webhook & Orchestration Server

This is the Node.js/Express backend server for **TalkBridge AI**. It functions as an intelligent ingestion and routing layer:
1. Receives incoming webhooks (e.g., TikTok comments).
2. Processes them using **Gemini AI** (`gemini-1.5-flash`) for multi-lingual intent classification, sentiment analysis, and context-aware reply drafting.
3. Inserts the record into **Supabase** for audit logs and real-time dashboard updates.
4. Routes high-urgency messages (urgency >= 7) via **Twilio SMS** to human agents, and lower-urgency responses via the **Zernio API** for auto-publishing.

---

## Quick Start

### 1. Environment Setup
Copy the environment variables template and fill in your API credentials:
```bash
cp .env.example .env
```
*Note: Make sure to define `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ZERNIO_API_KEY`, and `TWILIO_*` credentials.*

### 2. Install Dependencies
Run npm install in the server directory:
```bash
npm install
```

### 3. Run the Server
Start the server in development watch mode (runs on port `4000` by default):
```bash
npm run dev
```

---

## Endpoints

### 🩺 System Health
- **`GET /health`**
  - Verifies the server is online.

### 📥 Production Webhooks
- **`POST /webhook/tiktok`**
  - Receives live TikTok comment payloads. Responds with an immediate `200 ACK` and processes classification/routing asynchronously.

### 🧪 Test & Simulation (Hackathon Suite)
- **`POST /test/simulate`**
  - Processes a mock comment synchronously through the entire pipeline and returns the complete execution trace.
  - **Payload Format**:
    ```json
    {
      "platform": "tiktok",
      "username": "jane_doe",
      "message": "where is my order i paid 3 weeks ago 😡",
      "scenario": "late_delivery"
    }
    ```
- **`GET /test/messages`**
  - Retrieves the last 20 records processed from Supabase, sorted reverse-chronologically.

---

## Manual Pipeline Testing

No external social media or messaging accounts are required to test the backend. You can query the pipeline directly using curl:

### Test Case A: High Urgency Complaint (Triggers Twilio Escalation)
```bash
curl -X POST http://localhost:4000/test/simulate \
  -H "Content-Type: application/json" \
  -d '{"platform":"tiktok","username":"angry_customer","message":"this product is broken and it took 3 weeks to arrive! i want a refund immediately!"}'
```

### Test Case B: Compliment/Hype (Triggers Zernio Auto-Reply)
```bash
curl -X POST http://localhost:4000/test/simulate \
  -H "Content-Type: application/json" \
  -d '{"platform":"instagram","username":"fashion_guy","message":"this hoodie goes hard 🔥 when are you restocking?"}'
```

### Test Case C: Spam Ingestion (Skips Reply and Escalation)
```bash
curl -X POST http://localhost:4000/test/simulate \
  -H "Content-Type: application/json" \
  -d '{"platform":"sms","username":"+123456789","message":"Earn $5000 a day working from home click this shady link now!"}'
```

---

## Ingesting Real Webhooks (ngrok Tunneling)

To route real-time webhooks from Twilio, WhatsApp, or TikTok developers portal to your local machine:
1. Launch ngrok on port 4000:
   ```bash
   ngrok http 4000
   ```
2. Copy the secure HTTPS forwarding URL (e.g., `https://xxxx.ngrok-free.app`).
3. Configure your webhook URLs on external developer portals:
   - TikTok webhook: `https://xxxx.ngrok-free.app/webhook/tiktok`
   - Twilio webhook: `https://xxxx.ngrok-free.app/webhook/sms`

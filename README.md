# Xeno — AI-Native Mini CRM

> Engineering take-home assignment submission by **Jagadeesh Muralidharan**

A full AI-native Mini CRM for helping D2C brands reach their shoppers intelligently — with behavioral segmentation, AI-powered campaign composition, an async channel service simulation, and a conversational AI agent.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (opens at http://localhost:3000)
npm run dev

# 3. Build for production
npm run build
```

---

## Project Structure

```
xeno-crm/
├── index.html                  # Entry point
├── vite.config.js              # Vite config
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.js                 # App bootstrap, state, routing
    ├── styles/
    │   └── main.css            # Full design system
    ├── data/
    │   └── shoppers.js         # 60 shoppers, segments, campaign factory
    ├── utils/
    │   ├── channelService.js   # Async stub channel + receipt callbacks
    │   ├── aiService.js        # Anthropic API + smart fallback responses
    │   └── ui.js               # Badges, avatars, notifications, modals
    └── components/
        ├── Dashboard.js        # KPIs, pipeline viz, channel chart
        ├── Pages.js            # Shoppers, Segments, Campaigns, Analytics
        └── Composer.js         # AI Composer, AI Agent, modals
```

---

## Features

| Feature | Description |
|---|---|
| **Data Ingestion** | Upload CSV with AI auto-mapping; 60 seeded shoppers pre-loaded |
| **Segmentation** | 6 behavioral segments + AI Segment Builder (natural language) |
| **Campaigns** | Full lifecycle — draft → send → delivery → receipts |
| **Channel Service** | Async stub fires delivery/open/click/convert callbacks with realistic delays |
| **AI Composer** | Claude writes high-converting messages from your goal description |
| **AI Agent** | Conversational interface for natural language campaign orchestration |
| **Analytics** | Conversion funnel, revenue chart, performance matrix — all live |

---

## AI Features

The AI features work in two modes:

1. **Without API key** — Smart fallback responses that are data-aware (references real segment sizes and campaign revenue from live state)
2. **With API key** — Paste your Anthropic API key into the 🔑 field in AI Composer or AI Agent to enable live Claude responses

---

## Full System Architecture

This frontend is one of **three services** in the submission:

```
Frontend (this)  ←→  CRM Backend API  ──POST /send──►  Channel Service
                          ▲                                    │
                          └──── POST /api/receipts ◄───────────┘
                                   (async callbacks)
```

| Repo | Description |
|---|---|
| **xeno-crm** (this) | Vite frontend — AI Composer, Agent, live dashboard |
| **xeno-crm-backend** | Express CRM API — campaigns, segments, receipts webhook |
| **xeno-channel-service** | Stub channel — simulates async delivery + fires callbacks |

### Async Channel Callback Loop
The channel service is a separate HTTP service that accepts messages, responds 202 immediately, then fires async POST callbacks to the CRM's `/api/receipts` at realistic intervals — mirroring real providers (WhatsApp Business API webhooks, Twilio StatusCallback, SendGrid Events). Each channel has its own delivery rate and timing profile.

### Idempotent Receipts
The CRM deduplicates callbacks using a `Set<commId:status>` — the same receipt event is a no-op on replay. At scale: Redis `SETNX`.

### Staggered Dispatch
Campaigns dispatch messages at 70ms/shopper to avoid thundering-herd on the channel service. At scale: SQS FIFO with a token-bucket producer.

### Seeded Data
Shoppers are generated with a seeded PRNG — deterministic, realistic, no external data needed.

### Module Structure
Each concern is in its own file — `channelService.js` doesn't know about campaigns, `aiService.js` doesn't know about UI. `main.js` wires them with shared state.

---

## Deployment

```bash
npm run build
# Drag the /dist folder to netlify.com/drop for instant hosting
```

---

## Tech Stack

- **Vite** — build tool and dev server
- **Vanilla JS (ES Modules)** — no framework overhead
- **Chart.js** — channel delivery and revenue charts
- **Anthropic claude-sonnet-4-6** — AI message composition and agent
- **Inter** — typography

---

*Built by Jagadeesh Muralidharan for the Xeno FDE Assignment, June 2026*

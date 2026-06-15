# Xeno — AI-Native Mini CRM

> Engineering take-home assignment submission by **Gaayathri Muralidharan**

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
    ├── main.js                 # App bootstrap, state, routing, event wiring
    ├── styles/
    │   └── main.css            # Full design system (CSS variables, components)
    ├── data/
    │   └── shoppers.js         # 60 shoppers, 6 segments, campaign factory
    ├── utils/
    │   ├── channelService.js   # Async stub channel + receipt callback loop
    │   ├── aiService.js        # Anthropic API + smart fallback responses
    │   └── ui.js               # Badges, avatars, score rings, notifications
    └── components/
        ├── Dashboard.js        # KPIs, pipeline viz, channel delivery chart
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

## System Architecture

This frontend is one of **three services** in the submission:

| Repo | Role |
|---|---|
| **[xeno-crm](https://github.com/gaayathri-code-monk/xeno-crm)** | Vite + vanilla JS frontend — AI Composer, Agent, live dashboard |
| **[xeno-crm-backend](https://github.com/gaayathri-code-monk/xeno-crm-backend)** | Express CRM API — campaigns, segments, receipts webhook |
| **[xeno-channel-service](https://github.com/gaayathri-code-monk/xeno-channel-service)** | Stub channel — simulates async delivery + fires callbacks |

```
flowchart TB
    subgraph FE["🖥️  Frontend  (xeno-crm · Vite)"]
        direction TB
        UI["Dashboard · Shoppers · Segments"]
        Composer["✦ AI Composer"]
        Agent["⬡ AI Agent (chat)"]
        Analytics["◇ Analytics & Funnel"]
    end

    subgraph BE["🟣  CRM Backend  (xeno-crm-backend · Express :3000)"]
        direction TB
        CR["/api/customers"]
        SR["/api/segments · segmentEngine"]
        CAMP["/api/campaigns · staggered dispatch"]
        REC["/api/receipts · idempotent webhook"]
        ANA["/api/analytics"]
    end

    subgraph CH["📡  Channel Service  (xeno-channel-service · Express :4000)"]
        direction TB
        SEND["/send  →  202 Accepted"]
        SIM["simulate.js — per-channel delivery profiles\nWhatsApp 95% · SMS 88% · Email 82% · RCS 79%"]
    end

    subgraph AI["🤖  Anthropic Claude"]
        CLAUDE["claude-sonnet-4-6\nMessage Writer · Segment Picker · Agent"]
    end

    FE -->|"REST API calls"| BE
    CAMP -->|"POST /send\n{ commId, channel, recipient, message, callbackUrl }"| SEND
    SEND --> SIM
    SIM -->|"POST /api/receipts\n{ commId, status } — async, per-event, retried"| REC
    REC -->|"dedup Set + state update"| CAMP
    Composer & Agent <-->|"fetch (browser)"| CLAUDE

    style FE fill:#1a1040,stroke:#8B5CF6,color:#e2e8f0
    style BE fill:#0f1a20,stroke:#2DD4BF,color:#e2e8f0
    style CH fill:#1a1200,stroke:#F59E0B,color:#e2e8f0
    style AI fill:#1a0a20,stroke:#D946EF,color:#e2e8f0
```

### Key Design Decisions

| Decision | Implementation | At Scale |
|---|---|---|
| **Async callback loop** | Channel service fires POST to `/api/receipts` after random delay | Real provider webhooks (Twilio, WhatsApp Business API) |
| **Idempotent receipts** | `Set<commId:status>` deduplicates replays | Redis `SETNX` |
| **Staggered dispatch** | 70ms gap between messages to channel service | SQS FIFO + token-bucket producer |
| **Immediate 202 on /send** | Channel service never blocks CRM | Enqueue to async worker |
| **ACK before DB write** | `/api/receipts` responds before applying state | Kafka offset commit post-process |
| **Declarative segment filters** | `{ minSpend, minOrders, maxDaysSinceLast }` objects | Compile to SQL `WHERE` clause |

---

## Architecture Decisions & Tradeoffs

**What I chose not to build (and why):**

- No persistence — in-memory state is right for this scope. At production scale: PostgreSQL for customers/campaigns, Redis for receipt dedup and real-time stats
- No auth — out of scope for a demo CRM. At scale: JWT with role-based access (marketer vs admin)
- No retries on the frontend — the channel service handles retry simulation. At scale: exponential backoff with dead-letter queue
- No real messaging provider — the stub models the contract correctly (async callbacks, per-event status). Swapping in Twilio or Gupshup is a one-line change in channelService.js

---

## Tech Stack

- **Vite** — build tool and dev server
- **Vanilla JS (ES Modules)** — no framework overhead, clean module separation
- **Chart.js** — channel delivery and revenue charts
- **Anthropic claude-sonnet-4-6** — AI message composition and agent
- **Inter** — typography

---

## Deployment

```bash
npm run build
# Drag the /dist folder to netlify.com/drop for instant hosting
```

---


# Site2Support

Turn any e-commerce website into an AI-powered customer support agent in minutes.

Site2Support is a full-stack application that scrapes product data from any online store, builds a vector knowledge base, and serves a real-time RAG (Retrieval-Augmented Generation) chatbot capable of answering customer queries with accurate, source-grounded responses. It is designed for store owners, support teams, and developers who need an instant, zero-training AI assistant backed by live product data.

## Live Demo

[View Live Application](https://website-support-bot.vercel.app/)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Deployment](#deployment)

## Features

**One-Click Agent Creation**
Paste any store URL into the dashboard and the system automatically scrapes product pages, generates vector embeddings, and provisions a fully functional support agent. No manual data entry or training is required.

**Intelligent Web Scraping**
The scraper adapts to the target site. For JavaScript-heavy storefronts such as Myntra, Flipkart, and Ajio, it launches a headless Chromium instance with stealth evasion, scrolls to trigger lazy-loaded product cards, and extracts structured product data (name, brand, price, URL) from the DOM. For standard sites, it cascades through Trafilatura, BeautifulSoup, and Playwright in order of speed.

**RAG-Powered Chat with Streaming**
User queries are embedded using OpenAI's text-embedding-3-small model and matched against the knowledge base via pgvector cosine similarity. Retrieved product chunks are injected into a prompt template and streamed back to the user in real time via Server-Sent Events, ensuring low-latency conversational responses.

**Multi-Agent Isolation**
Each store agent operates in a fully isolated data silo. Knowledge chunks are tagged with an explicit agent_id column, and the vector search function filters strictly by agent, preventing any cross-contamination between stores.

**Background Job Queue**
Scraping jobs are offloaded to a BullMQ worker backed by Redis. The API returns immediately with a 202 status, and the dashboard polls agent status to reflect progress in real time with a step-by-step loading overlay.

**Knowledge Base Management**
A dedicated Knowledge Base view allows users to inspect indexed pages, view source URLs, and track indexing status per agent. Re-scraping is supported with a single button to refresh stale product data.

**Authentication and User Profiles**
Supabase Auth handles user registration, login, and session management. Row Level Security policies ensure that each user can only access their own agents and data. Profile management with avatar upload is included.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Framer Motion, React Router |
| UI Components | Radix UI, Lucide React, React Markdown |
| Backend API | Node.js, Express 5, TypeScript |
| Job Queue | BullMQ with Redis (via IORedis) |
| Web Scraping | Python (Playwright, BeautifulSoup, Trafilatura) |
| Database | Supabase (PostgreSQL + pgvector) |
| Embeddings | OpenAI text-embedding-3-small (1536 dimensions) |
| LLM | OpenAI GPT-4o-mini |
| Authentication | Supabase Auth with Row Level Security |

## Project Structure

```
WebsiteSupportBot/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── agentsRouter.ts        # Agent creation and scrape job endpoints
│   │   │   └── chatRouter.ts          # RAG chat endpoint with SSE streaming
│   │   ├── services/
│   │   │   └── supabase.ts            # Supabase admin client (bypasses RLS)
│   │   ├── utils/
│   │   │   └── config.ts              # Centralized environment configuration
│   │   ├── workers/
│   │   │   ├── jobs.ts                # BullMQ queue and worker definitions
│   │   │   └── scraperService.ts      # Orchestrates scraping, chunking, and embedding
│   │   └── index.ts                   # Express server entry point
│   ├── scripts/
│   │   └── crawl4ai_service.py        # Python scraper (Playwright + BS4 + Trafilatura)
│   ├── supabase_setup.sql             # pgvector extension and match_chunks RPC function
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # Reusable UI primitives (Button, Input, etc.)
│   │   │   ├── animate-ui/            # Animated UI components
│   │   │   ├── AuthForm.jsx           # Login and registration form
│   │   │   ├── ChatWidget.jsx         # Embeddable demo chat widget
│   │   │   ├── HeroChatDemo.jsx       # Landing page chat animation
│   │   │   ├── KnowledgeBaseView.jsx  # Knowledge base inspector panel
│   │   │   ├── FAQAccordion.jsx       # FAQ section component
│   │   │   └── AuroraRibbon.jsx       # Decorative background animation
│   │   ├── context/
│   │   │   ├── AgentContext.jsx        # Agent CRUD state and Supabase sync
│   │   │   ├── AuthContext.jsx         # Authentication state provider
│   │   │   ├── UserContext.jsx         # User profile state provider
│   │   │   ├── ChatThemeContext.jsx    # Chat widget theming
│   │   │   └── ThemeContext.jsx        # Global theme management
│   │   ├── hooks/
│   │   │   ├── use-controlled-state.jsx
│   │   │   └── use-mobile.jsx         # Responsive breakpoint hook
│   │   ├── lib/
│   │   │   ├── supabase.js            # Supabase client initialization
│   │   │   ├── utils.js               # Utility functions (cn, etc.)
│   │   │   └── get-strict-context.jsx # Typed context accessor
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx        # Public marketing page
│   │   │   ├── AuthPage.jsx           # Authentication page wrapper
│   │   │   ├── Dashboard.jsx          # Main agent management and chat playground
│   │   │   └── AccountSettings.jsx    # User profile and preferences
│   │   ├── App.jsx                    # Route definitions and layout
│   │   └── main.jsx                   # Application entry point
│   ├── supabase_schema.sql            # User profiles, agents, and RLS policies
│   ├── package.json
│   └── vite.config.js
└── .gitignore
```

## System Architecture

```
User enters store URL
        |
        v
  ┌─────────────┐       ┌───────────────┐       ┌──────────────────┐
  │  Frontend    │──────>│  Express API  │──────>│  BullMQ Queue    │
  │  (React)     │  POST │  /api/agents  │  add  │  (Redis)         │
  └─────────────┘       │  /scrape      │       └────────┬─────────┘
                        └───────────────┘                │
                                                         v
                                              ┌──────────────────┐
                                              │  Scrape Worker   │
                                              │  (jobs.ts)       │
                                              └────────┬─────────┘
                                                       │
                                                       v
                                              ┌──────────────────┐
                                              │  Python Scraper  │
                                              │  (crawl4ai)      │
                                              │  Playwright/BS4  │
                                              └────────┬─────────┘
                                                       │
                                          product data (JSON)
                                                       │
                                                       v
                                              ┌──────────────────┐
                                              │  Embedding       │
                                              │  Generation      │
                                              │  (OpenAI)        │
                                              └────────┬─────────┘
                                                       │
                                           vectors + metadata
                                                       │
                                                       v
                                              ┌──────────────────┐
                                              │  Supabase        │
                                              │  (PostgreSQL +   │
                                              │   pgvector)      │
                                              └──────────────────┘
                                                       ^
                                                       │
                                            match_chunks RPC
                                                       │
  ┌─────────────┐       ┌───────────────┐       ┌──────┴───────────┐
  │  Frontend    │<──────│  Express API  │<──────│  Vector Search   │
  │  Chat UI     │  SSE  │  /api/chat    │  RAG  │  + LLM Prompt    │
  └─────────────┘       └───────────────┘       └──────────────────┘
```

## Getting Started

### Prerequisites

| Requirement | Details |
|---|---|
| Node.js | Version 18 or higher |
| Python | Version 3.10 or higher |
| Redis | Running locally on port 6379 or a hosted instance |
| Supabase | A project with the pgvector extension enabled |
| OpenAI API Key | Access to text-embedding-3-small and gpt-4o-mini |
| Playwright | Chromium browser installed via `playwright install chromium` |

### Setup

1. Clone the repository

```bash
git clone https://github.com/your-username/WebsiteSupportBot.git
cd WebsiteSupportBot
```

2. Set up the backend

```bash
cd backend
npm install
```

3. Create a Python virtual environment and install dependencies

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install playwright beautifulsoup4 trafilatura requests
playwright install chromium
```

4. Set up the frontend

```bash
cd ../frontend
npm install
```

5. Configure the database

Run `frontend/supabase_schema.sql` in the Supabase SQL Editor to create the profiles, agents tables and RLS policies. Then run `backend/supabase_setup.sql` to create the pgvector extension, knowledge_chunks agent_id column, and the `match_chunks` RPC function.

6. Create environment files

Create `backend/.env` and `frontend/.env.local` using the variables listed in the section below.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Optional | Server port. Defaults to 3001 |
| `SUPABASE_URL` | Required | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | Supabase service role key (bypasses RLS) |
| `OPENAI_API_KEY` | Required | OpenAI API key for embeddings and chat |
| `REDIS_HOST` | Optional | Redis host. Defaults to 127.0.0.1 |
| `REDIS_PORT` | Optional | Redis port. Defaults to 6379 |
| `FIRECRAWL_API_KEY` | Optional | Firecrawl API key (unused in current scraper) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Required | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Required | Supabase anonymous/public key |
| `VITE_API_URL` | Required | Backend API base URL (e.g., http://localhost:3001) |

## Running the Application

Start Redis (if running locally):

```bash
redis-server
```

Start the backend API server:

```bash
cd backend
npm run dev
```

Start the BullMQ worker (in a separate terminal):

```bash
cd backend
npm run worker
```

Start the frontend development server:

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3001`.

### Production Build

```bash
cd frontend
npm run build
npm run preview
```

```bash
cd backend
npm run build
npm start
```

## API Reference

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `POST` | `/api/agents/scrape` | Enqueue a scraping job for a store URL | `{ "agentId": "uuid", "url": "string" }` |
| `POST` | `/api/chat` | Send a message and receive a streamed RAG response | `{ "agentId": "uuid", "message": "string", "history": [] }` |
| `GET` | `/health` | Health check endpoint | None |

The chat endpoint returns a Server-Sent Events stream. Each event contains a JSON payload with a `text` field. The stream terminates with a `[DONE]` event.

## Deployment

The application can be deployed to any platform that supports Node.js and Python runtimes.

**Frontend** -- Build the static bundle with `npm run build` and deploy the `dist/` directory to any static hosting provider (Vercel, Netlify, Cloudflare Pages).

**Backend** -- Deploy the Express server to a platform that supports long-running Node.js processes (Render, Railway, Fly.io). Ensure the Python virtual environment and Playwright Chromium binary are available in the deployment environment.

**Worker** -- The BullMQ worker must run as a separate process alongside the API server. Configure it as a background worker or a second service on your deployment platform.

**Redis** -- Use a managed Redis instance (Upstash, Redis Cloud, Railway Redis) and update `REDIS_HOST` and `REDIS_PORT` accordingly.

**Database** -- No additional deployment steps are required for Supabase. Ensure the SQL migrations have been run and the pgvector extension is enabled.

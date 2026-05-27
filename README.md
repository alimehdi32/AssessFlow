# VedaAI — AI Assessment Creator

A full-stack AI-powered assessment creation platform for teachers. Teachers can create assignments, generate structured question papers using local AI (Ollama), track generation progress in real time via Socket.IO, and export print-ready PDFs.

Built for the **VedaAI Full Stack Engineering Assignment** ([Figma designs](https://www.figma.com/design/nB2HMm1BhTpmHcHrmEslGB/VedaAI---Hiring-Assignment?node-id=0-1)).

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Approach & Design Decisions](#approach--design-decisions)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Guide](#setup-guide)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Database Schema](#database-schema)
- [AI Pipeline](#ai-pipeline)
- [Background Jobs (BullMQ)](#background-jobs-bullmq)
- [PDF Export](#pdf-export)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Assignment Requirements Checklist](#assignment-requirements-checklist)

---

## Features

### Core (Assignment Requirements)

- **Assignment creation wizard** — Two-step form with title, subject, class, due date, question types (quantity + marks), optional PDF/TXT upload, and additional instructions
- **Form validation** — Client-side counters enforce minimum values (≥ 1); server-side Zod validation on auth; assignment title required before proceeding
- **AI question generation** — Structured prompt → Ollama → JSON parse → normalized sections/questions stored in the database (never renders raw LLM output)
- **Structured output** — Sections (A, B, …) with titles, instructions, questions, difficulty tags, and marks; student info fields (Name, Roll Number, Section) on the exam paper view
- **Real-time updates** — Socket.IO events for generation started, progress, completed, and failed
- **Background processing** — BullMQ workers for AI generation and PDF export
- **State management** — Zustand stores for auth and assignment wizard state

### Bonus / Extra

- **PDF download** — A4-formatted exam paper with student info lines, sections, marks, and answer key (`pdf-lib`)
- **Regenerate** — Action bar button re-queues AI generation with the original config and shows real-time progress
- **Answer key toggle** — Show/hide model answers on the output page
- **JWT authentication** — Register, login, logout, token refresh with HTTP-only cookies
- **Responsive UI** — Desktop sidebar + mobile bottom navigation, aligned with Figma-inspired design
- **File upload context** — PDF/TXT text extraction fed into the AI prompt as reference material

### Placeholder Pages (UI Shell)

These pages exist in the navigation for design completeness but are not fully implemented:

- Dashboard (static stats)
- My Groups
- AI Teacher's Toolkit
- My Library
- Settings

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     FRONTEND — Next.js 14 (App Router)               │
│  Login/Register → Assignments List → Create Wizard → Exam Output     │
│  Zustand (auth + wizard) │ Axios + JWT refresh │ Socket.IO client  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  HTTP REST  +  WebSocket
┌───────────────────────────────▼──────────────────────────────────────┐
│                  BACKEND — Express + TypeScript (port 5000)          │
│  Auth Middleware │ Assignment Controller │ Socket.IO Server          │
└───────┬─────────────────┬──────────────────────┬─────────────────────┘
        │                 │                      │
   PostgreSQL          Redis                 BullMQ Queues
   (Prisma ORM)    (job broker)         assignment-generation
        │                 │                 pdf-generation
        │                 │                      │
        │    ┌────────────▼──────────────────────▼──────────────┐
        │    │         WORKER PROCESS (separate terminal)        │
        │    │  AI Worker → Ollama → Parse JSON → Save to DB     │
        │    │  PDF Worker → pdf-lib → generated-pdfs/           │
        │    │  Socket bridge (port 5001) for worker emits       │
        └────┤  Prisma writes: User, Assignment, Section, etc.   │
             └──────────────────────────────────────────────────┘
                                    │
                             Ollama (local)
                           llama3.1:8b model
```

### Request Flow — Create Assignment

```
1. Teacher submits form (multipart: metadata + optional file)
2. POST /api/assignments → Assignment saved (status: PENDING)
3. Job enqueued on assignment-generation queue
4. GenerationJob record created (status: WAITING)
5. API returns { assignment, jobId }
6. Frontend connects Socket.IO → emits authenticate(userId)
7. AI Worker picks up job:
   a. Extract text from uploaded file (if any)
   b. Build structured prompt → call Ollama
   c. Sanitize + validate JSON response
   d. Persist AssignmentSection + Question records
   e. Update assignment status → COMPLETED
   f. Emit generation_completed via Socket.IO
8. Frontend navigates to /assignments/:id
```

---

## Approach & Design Decisions

### 1. Structured AI Output (Not Raw LLM Text)

The assignment explicitly requires **not** rendering raw LLM responses. The approach:

1. **`buildPrompt()`** in `ai.service.ts` constructs a strict JSON schema prompt with assignment metadata, question type requirements, difficulty distribution (35% easy / 40% medium / 25% hard), and optional uploaded reference text (truncated to 3000 chars).
2. **Ollama** returns a single JSON payload (`stream: false`).
3. **`sanitizeJSON()`** strips markdown fences, extracts the first `{...}` block, validates the `sections` array, and normalizes each question field (`text`, `marks`, `difficulty`, `answer`).
4. **Retry logic** — Up to 3 attempts with exponential backoff (2s, 4s, 8s) if parsing fails.
5. **Database persistence** — Parsed data is stored in relational tables (`AssignmentSection`, `Question`) and served to the frontend as structured API responses.

### 2. PostgreSQL + Prisma

The assignment spec mentions MongoDB. This implementation uses **PostgreSQL with Prisma** because assignments have a clear relational structure (User → Assignment → Sections → Questions), and Prisma provides type-safe queries, migrations, and schema enforcement.

Redis fulfills the caching/job-state requirement via **BullMQ**.

### 3. Local AI via Ollama

Instead of a paid cloud API (GPT/Claude), the project uses **Ollama with `llama3.1:8b`**:

- No API keys required for local development.
- Fully offline-capable after model download.
- Easily swappable — change `OLLAMA_URL` and `OLLAMA_MODEL` in `.env` to point to any OpenAI-compatible or Ollama endpoint.

### 4. Background Jobs with BullMQ

AI generation can take 30–120 seconds. Synchronous API responses would timeout. BullMQ decouples:

- **API** — Creates assignment, enqueues job, returns immediately.
- **Worker** — Processes generation asynchronously with concurrency of 2.
- **Job tracking** — `GenerationJob` table stores status (`WAITING` → `ACTIVE` → `COMPLETED` / `FAILED`).

### 5. Real-Time UX with Socket.IO

After creating an assignment, the frontend shows a full-screen generation overlay. Socket.IO events update progress messages and trigger navigation on completion. Clients authenticate by emitting their `userId`; the server joins them to a `user:{userId}` room.

### 6. Frontend State with Zustand

- **`authStore`** — Persisted user + access token (localStorage via `zustand/middleware`).
- **`assignmentStore`** — Ephemeral wizard state (title, question types, file, due date). Reset after successful submission.

### 7. PDF Generation via BullMQ

PDF downloads are handled asynchronously:

1. `GET /api/assignments/:id/pdf` checks for a cached file in `generated-pdfs/`.
2. If missing, a job is enqueued on the `pdf-generation` queue.
3. The API waits for the PDF worker to finish (`job.waitUntilFinished`).
4. The cached PDF is streamed to the client.

The PDF worker uses **`pdf-lib`** for A4 layout with school header, student info blank lines, section headings, wrapped question text, right-aligned marks, page breaks, and an answer key.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, Socket.IO Client, Axios, React Hook Form, Zod, Framer Motion |
| Backend | Node.js, Express, TypeScript, Prisma, BullMQ, Socket.IO, Multer, Winston |
| Database | PostgreSQL 15 |
| Cache / Queue | Redis 7 (via BullMQ + ioredis) |
| AI | Ollama (`llama3.1:8b`) |
| PDF | pdf-lib, pdf-parse (text extraction) |
| Infrastructure | Docker Compose (PostgreSQL + Redis) |

---

## Project Structure

```
AssessFlow/
├── docker-compose.yml              # PostgreSQL + Redis containers
├── README.md
│
├── backend/
│   ├── .env                        # Environment variables (not committed)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── migrations/             # Prisma migration history
│   ├── uploads/                    # Uploaded PDF/TXT files (runtime)
│   ├── generated-pdfs/             # Cached PDF exports (runtime)
│   ├── logs/                       # Winston log files (runtime)
│   └── src/
│       ├── index.ts                # Express + Socket.IO entry (port 5000)
│       ├── config/
│       │   ├── db.ts               # Prisma client singleton
│       │   ├── redis.ts            # ioredis connection for BullMQ
│       │   └── logger.ts           # Winston logger
│       ├── middleware/
│       │   ├── auth.middleware.ts  # JWT verification
│       │   ├── error.middleware.ts   # Global error handler
│       │   └── validate.middleware.ts # Zod request validation
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   └── assignment.controller.ts
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   └── assignment.routes.ts
│       ├── services/
│       │   ├── ai.service.ts       # Ollama prompt + JSON parsing
│       │   ├── file.service.ts     # PDF/TXT text extraction
│       │   └── pdf.service.ts      # A4 PDF generation
│       ├── queues/
│       │   └── index.ts            # BullMQ queue definitions
│       ├── sockets/
│       │   └── index.ts            # Socket.IO server + emitToUser
│       └── workers/
│           ├── index.ts            # Worker entry + socket bridge (port 5001)
│           ├── ai.worker.ts        # AI generation worker
│           └── pdf.worker.ts       # PDF generation worker
│
└── frontend/
    ├── .env.local                  # NEXT_PUBLIC_API_URL
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── middleware.ts               # Next.js route middleware
    ├── store/
    │   ├── authStore.ts            # Zustand — authentication state
    │   └── assignmentStore.ts      # Zustand — create wizard state
    ├── lib/
    │   ├── api.ts                  # Axios instance + token refresh
    │   └── socket.ts               # Socket.IO singleton
    ├── components/
    │   ├── layout/                 # Sidebar, Header, MobileNav, DashboardLayout
    │   ├── assignments/            # AssignmentCard
    │   ├── create/                 # QuestionTypeRow
    │   └── ui/                     # SkeletonCard
    └── app/
        ├── layout.tsx
        ├── page.tsx                # Redirects to /login
        ├── globals.css
        ├── login/page.tsx
        ├── register/page.tsx
        ├── forgot-password/page.tsx
        ├── dashboard/page.tsx
        ├── assignments/
        │   ├── page.tsx            # Assignment list + search
        │   └── [id]/page.tsx       # Exam paper output view
        ├── create/page.tsx         # Two-step creation wizard
        ├── groups/page.tsx
        ├── toolkit/page.tsx
        ├── library/page.tsx
        └── settings/page.tsx
```

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18+ | Runtime for frontend and backend |
| **Docker Desktop** | Latest | PostgreSQL and Redis containers |
| **Ollama** | Latest | Local LLM inference |
| **Git** | Any | Clone and version control |

---

## Setup Guide

### Step 1 — Clone the Repository

```powershell
git clone <your-repo-url>
cd AssessFlow
```

### Step 2 — Install Ollama and Pull the Model

Download and install Ollama from [https://ollama.ai](https://ollama.ai), then pull the model:

```powershell
ollama pull llama3.1:8b

# Verify Ollama is running (should respond at http://localhost:11434)
ollama list
```

Keep Ollama running while using the app. If it is not already running as a background service:

```powershell
ollama serve
```

### Step 3 — Start Infrastructure (PostgreSQL + Redis)

From the project root:

```powershell
docker compose up -d

# Verify both containers are healthy
docker compose ps
```

Expected output:

```
NAME                   STATUS    PORTS
assessflow_postgres    running   0.0.0.0:5432->5432/tcp
assessflow_redis       running   0.0.0.0:6379->6379/tcp
```

### Step 4 — Backend Setup

```powershell
cd backend

# Install dependencies
npm install

# Copy environment file and adjust if needed
copy .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations (creates all tables)
npx prisma migrate dev --name init

# Optional: open visual DB browser
npx prisma studio
```

### Step 5 — Frontend Setup

```powershell
cd ../frontend

npm install

# Create .env.local (if not present)
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Running the Application

You need **three terminal windows** running simultaneously:

### Terminal 1 — Backend API Server

```powershell
cd backend
npm run dev
```

- API: [http://localhost:5000](http://localhost:5000)
- Health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- Socket.IO: same port (5000)

### Terminal 2 — Background Workers

```powershell
cd backend
npm run worker
```

- Processes `assignment-generation` and `pdf-generation` queues
- Socket bridge on port 5001 (worker-side emits)

> **Important:** The API server alone does **not** process background jobs. Both Terminal 1 and Terminal 2 must be running.

### Terminal 3 — Frontend Dev Server

```powershell
cd frontend
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)

### First Use

1. Open [http://localhost:3000](http://localhost:3000)
2. Register a new teacher account
3. Navigate to **Create Assignment**
4. Fill in assignment details, configure question types, optionally upload a PDF/TXT
5. Submit — watch the generation overlay for real-time progress
6. View the generated exam paper and download PDF

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/assessflow"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# JWT (change in production!)
JWT_ACCESS_SECRET="your-access-secret-here-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-here-change-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Server
PORT=5000
NODE_ENV="development"
WORKER_PORT=5001

# Ollama
OLLAMA_URL="http://localhost:11434/api/generate"
OLLAMA_MODEL="llama3.1:8b"

# File Upload
UPLOAD_DIR="./uploads"

# CORS
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## API Reference

All assignment routes require authentication (JWT via cookie or `Authorization: Bearer` header).

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login, returns user + sets cookies |
| `POST` | `/api/auth/logout` | Clear session |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/auth/me` | Get current user |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assignments` | List assignments (supports `?search=`, `?page=`, `?status=`) |
| `GET` | `/api/assignments/:id` | Get assignment with sections + questions |
| `POST` | `/api/assignments` | Create assignment + enqueue AI job (multipart form) |
| `PATCH` | `/api/assignments/:id` | Update assignment metadata |
| `DELETE` | `/api/assignments/:id` | Delete assignment and uploaded files |
| `GET` | `/api/assignments/:id/status` | Get latest generation job status |
| `GET` | `/api/assignments/:id/pdf` | Download generated PDF |
| `POST` | `/api/assignments/:id/regenerate` | Re-queue AI generation |

### Create Assignment — Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Assignment title |
| `subject` | string | No | Default: `General` |
| `class` | string | No | Default: `10th` |
| `dueDate` | ISO date string | No | Due date |
| `questionTypes` | JSON string | Yes | `[{ type, quantity, marks }]` |
| `additionalInfo` | string | No | Extra instructions for AI |
| `file` | file | No | PDF or TXT (max 10 MB) |

---

## WebSocket Events

Connect to the API server Socket.IO instance. After connecting, emit `authenticate` with the user's ID.

| Event | Direction | Payload |
|-------|-----------|---------|
| `authenticate` | Client → Server | `userId: string` |
| `generation_started` | Server → Client | `{ assignmentId, jobId }` |
| `generation_progress` | Server → Client | `{ assignmentId, message, progress }` |
| `generation_completed` | Server → Client | `{ assignmentId, totalQuestions, totalMarks, sections }` |
| `generation_failed` | Server → Client | `{ assignmentId, error }` |

---

## Database Schema

```
User ────────────── Assignment ────── AssignmentSection ─── Question
  │                     │
  │                     ├── UploadedFile
  │                     ├── GenerationJob
  │                     └── QuestionTypeConfig
```

### Enums

| Enum | Values |
|------|--------|
| `AssignmentStatus` | `PENDING`, `GENERATING`, `COMPLETED`, `FAILED` |
| `Difficulty` | `EASY`, `MEDIUM`, `HARD` |
| `JobStatus` | `WAITING`, `ACTIVE`, `COMPLETED`, `FAILED` |

### Prisma Commands

```powershell
cd backend

npx prisma generate          # Regenerate client after schema changes
npx prisma migrate dev       # Create + apply migration (dev)
npx prisma migrate deploy    # Apply migrations (production)
npx prisma studio            # Visual database browser
npx prisma migrate reset     # Reset DB (deletes all data)
```

---

## AI Pipeline

**File:** `backend/src/services/ai.service.ts`

```
Input (title, subject, class, questionTypes, additionalInfo, uploadedText)
    │
    ▼
buildPrompt() — structured JSON schema instructions
    │
    ▼
POST Ollama /api/generate  (model: llama3.1:8b, stream: false, timeout: 120s)
    │
    ▼
sanitizeJSON() — strip markdown, extract JSON, validate sections[]
    │
    ▼
GeneratedAssignment { sections: [{ title, instruction, questions[] }] }
    │
    ▼
AI Worker persists to PostgreSQL
```

**Sample prompt excerpt:**

```
You are an expert teacher creating a professional examination paper.
Generate questions STRICTLY following the structure below.

ASSIGNMENT DETAILS:
- Title: Quiz on Electricity
- Subject: Physics
- Class: 10th
- Question Requirements:
- 4 Multiple Choice Questions (1 mark each)
- 3 Short Questions (2 marks each)

RETURN ONLY VALID JSON. NO MARKDOWN. NO EXPLANATION.
```

---

## Background Jobs (BullMQ)

| Queue | Worker | Concurrency | Retries | Purpose |
|-------|--------|-------------|---------|---------|
| `assignment-generation` | `ai.worker.ts` | 2 | 3 (exponential) | AI question generation |
| `pdf-generation` | `pdf.worker.ts` | 1 | 2 (fixed) | Async PDF rendering |

Redis connection config is shared via `getRedisConnection()` in `config/redis.ts`.

---

## PDF Export

**Endpoint:** `GET /api/assignments/:id/pdf`

- Enqueued on the `pdf-generation` BullMQ queue when not yet cached
- Generated programmatically with `pdf-lib` (595 × 842 pt A4 pages)
- Includes school header, student info blank lines (Name / Roll No. / Section), section titles, wrapped question text, marks alignment, page breaks, and answer key
- Cached at `backend/generated-pdfs/{assignmentId}.pdf` after first generation

---

## Security

- JWT access tokens expire in 15 minutes; refresh tokens last 7 days
- Refresh token rotation — each refresh invalidates the previous token
- HTTP-only cookies reduce XSS token theft risk
- Rate limiting: 200 requests / 15 min globally; 30 / 15 min on auth routes
- File uploads restricted to PDF and TXT only (max 10 MB)
- Passwords hashed with bcrypt (cost factor 12)
- Assignment routes scoped to authenticated user's own data

---

## Troubleshooting

### Cannot connect to Redis

```powershell
docker compose up -d redis
docker compose ps
```

### Database connection failed / tables missing

```powershell
docker compose up -d postgres
cd backend
npx prisma migrate dev
```

### Ollama timeout or empty AI response

```powershell
ollama serve
ollama list    # should show llama3.1:8b
ollama pull llama3.1:8b
```

### CORS error in browser

Ensure `FRONTEND_URL` in `backend/.env` matches your Next.js port (default `http://localhost:3000`).

### Jobs not processing

Confirm Terminal 2 (`npm run worker`) is running alongside the API server.

### Generation overlay stuck

- Verify Ollama is running and the worker process is active
- Check `backend/logs/error.log` for worker errors
- Poll fallback: navigate manually to `/assignments/:id` — the page shows a loading state while status is `PENDING` or `GENERATING`

---

## Assignment Requirements Checklist

| Requirement | Status |
|-------------|--------|
| Assignment creation form (file upload, due date, question types, marks, instructions) | Done |
| Form validation (no empty / negative values) | Done |
| Zustand state management | Done |
| WebSocket real-time updates | Done |
| Structured AI prompt + JSON parsing (no raw LLM render) | Done |
| Sections, questions, difficulty, marks | Done |
| Node.js + Express (TypeScript) backend | Done |
| Database for assignments & results | Done (PostgreSQL + Prisma) |
| Redis for job state | Done (BullMQ) |
| BullMQ background jobs | Done |
| WebSocket notifications | Done |
| Structured output page with difficulty badges + student info | Done |
| PDF export with proper formatting | Done |
| Regenerate (UI + API) | Done |
| Mobile responsive UI | Done |
| README with architecture + setup | Done |

---

## Production Build

```powershell
# Backend
cd backend
npm run build
npm start          # API server (requires separate worker process)

# Frontend
cd frontend
npm run build
npm start
```

For production deployment, also run:

```powershell
cd backend
npx prisma migrate deploy
npm run worker
```

---

## License

ISC

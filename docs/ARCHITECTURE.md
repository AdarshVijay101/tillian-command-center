# Architecture

## Overview
Tillian Command Center is a completely local-first system designed strictly for execution on 127.0.0.1. It acts as a resilient, protocol-aware dashboard orchestrating personal AI routines, local cron jobs, and heavy WSL AI tasks.

## Frontend
The frontend is a React application powered by Vite. It uses TailwindCSS with custom glassmorphism components to deliver a premium JARVIS-style dashboard. The frontend polls the backend using a local REST API and never connects directly to external cloud services.

## Backend
The backend is an Express.js Node application. It is hard-bound to `127.0.0.1:8787` and actively refuses to bind to `0.0.0.0`, preventing any inbound traffic from the LAN or external network.

## SQLite
State is managed locally using a SQLite3 database (`tillian.db`). It tracks job queues, artifact metadata, system health check-ins, and notification delivery ledgers. The database is heavily guarded by `.gitignore` rules to ensure personal metrics are never pushed to GitHub.

## OpenClaw
Tillian integrates with an external, locally hosted WSL OpenClaw Gateway (`localhost:18789`). OpenClaw is responsible for securely proxying heavy AI workloads (like extensive LLM planning). Tillian gracefully handles OpenClaw going offline by transitioning into a non-critical degraded state.

## Obsidian Drop Folder Pipeline
Instead of the AI directly mutating the user's Obsidian Second Brain, Tillian enforces an asynchronous pipeline:
1. The AI drops generated markdown outputs into an `_OPENCLAW_DROP` folder.
2. Tillian indexes these raw drops into an approval queue.
3. The human user reviews them via the UI before moving them into the final processed structure.

## Telegram PowerShell Boundary
Tillian relies on Windows PowerShell scripts to push outbound notifications via Telegram. The Node/React stack never knows your Telegram Bot Token or Chat ID. These credentials remain isolated in `.env` files consumed exclusively by PowerShell. 

## Job Queue
Heavy AI operations are not evaluated automatically. Instead, they are routed into a pre-flight database queue. A human must explicitly hit the "Approve & Run" button in the UI, ensuring no runaway AI loops occur.

## Artifact Review + Evidence Layer
The Artifact Review subsystem guarantees files are read and previewed without executing their contents or moving the underlying file paths. The Evidence Layer can generate sharable summaries of these artifacts while actively redacting absolute Windows file paths (`C:\Users\...`) into safe `[REDACTED_LOCAL_PATH]` strings.

## Data Flow
1. User interacts with Frontend.
2. Frontend queries Express Backend (`127.0.0.1:8787`).
3. Backend fetches state from SQLite or launches an approved PowerShell script via `child_process`.
4. PowerShell scripts execute the actual workload, optionally calling OpenClaw, and update local JSON ledgers.
5. Backend parses JSON ledgers and updates the SQLite database.

## Safety Boundaries
* **No Direct File Mutation**: The backend only reads files, it does not rewrite your second brain.
* **No Public Exposure**: Bound to localhost.
* **Separation of Secrets**: Node does not touch `.env`.
* **Path Scrubbing**: Generates shareable proof of AI usage without leaking directory structures.

# Tillian Command Center

![Version](https://img.shields.io/badge/version-v1.0--local-blue)
![Local-First](https://img.shields.io/badge/architecture-local--first-success)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)
![Express](https://img.shields.io/badge/Backend-Express.js-000000?logo=nodedotjs)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)


## What It Is
Tillian Command Center is a **local-first personal AI operations console**. It provides a premium JARVIS-style dashboard to manage, review, and execute AI agent workflows locally using an Obsidian Second Brain and PowerShell integrations.

## Why Local-First
AI agents require access to highly sensitive personal data. Sending this data to a cloud service introduces privacy risks. Tillian ensures your AI agents run entirely on your local machine (`127.0.0.1`), allowing you to harness the power of AI without exposing your personal Second Brain or local credentials to external servers.

## Core Features
- **Premium JARVIS-style Dashboard**: A visually striking mission control interface.
- **Local Backend Bridge**: Connects a React Vite frontend to a local Express/SQLite backend.
- **System Doctor & Reliability Harness**: Continuous health monitoring of local scripts and endpoints.
- **Protocol-aware Routines & Check-ins**: Tracks your personal daily protocols.
- **Notification Delivery Ledger**: Monitors the delivery success of local Telegram PowerShell scripts.
- **Safe Agent Job Queue & Approval Cockpit**: Pre-flight human approval for heavy AI actions before they run.
- **Artifact Review Inbox & Evidence Packages**: Reviews AI-generated files safely without mutating them and creates redacted evidence for sharing.

## Architecture Overview
Tillian is composed of three main layers:
1. **Frontend**: A React/Vite dashboard running on `localhost:5173`.
2. **Backend**: An Express server running on `127.0.0.1:8787`, backed by a local SQLite database.
3. **Execution Layer**: Secure Windows PowerShell scripts and an optional OpenClaw WSL Gateway that handles raw execution.

## Safety Model
> [!WARNING]
> **Explicit Safety Boundaries:**
> - Tillian does **NOT** expose a public backend. It refuses to bind to `0.0.0.0`.
> - It does **NOT** include or track any secrets in the repository (`.env` files are fully gitignored).
> - All Telegram and AI API keys stay exclusively in untracked local environments.
> - Heavy jobs queue safely and wait for human approval.
> - Artifacts are previewed in read-only mode to prevent unintended system mutations.

## Demo Mode
Tillian includes a secure **Demo Mode** accessible from the UI. When enabled, it intercepts real API calls and simulates data. This allows for safe portfolio walkthroughs, screen sharing, and employer presentations without exposing private schedules, IP addresses, or underlying database contents.

## Setup
Follow the [Local Setup Guide](docs/LOCAL_SETUP.md) for full prerequisites and dependencies.
```bash
npm install
npm run server
```

## Running Locally
Run both the frontend and backend concurrently:
```bash
npm run dev:all
```
Access the dashboard at `http://localhost:5173`.

## Screens / Pages
- **Mission Control**: Your daily command center.
- **Check-in**: Track recurring life routines.
- **Scheduler**: Monitor background script reliability.
- **Artifacts**: Review safe AI-generated files before they affect your vault.
- **Evidence**: Generate redacted markdown packages proving AI value.
- **Release**: Validate repository hygiene before publishing to GitHub.

## What Is Intentionally Excluded
- Cloud synchronization
- Built-in authentication (local physical access is the security boundary)
- Public execution endpoints
- Direct database mutation from the AI (AI must submit artifacts to the Drop Folder)

## Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [Safety Model](docs/SAFETY_MODEL.md)
- [Local Setup](docs/LOCAL_SETUP.md)
- [Demo Script](docs/DEMO_SCRIPT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Roadmap](docs/ROADMAP.md)
- [Release Checklist](docs/RELEASE_CHECKLIST.md)

## Roadmap
Tillian Command Center v1.0-local establishes a rock-solid foundation. Future enhancements will focus strictly on improving local telemetry and Offline speech integrations. Read more in the [Roadmap](docs/ROADMAP.md).

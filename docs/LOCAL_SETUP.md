# Local Setup Guide

Follow these steps to deploy Local AI Command Center on your local Windows machine.

## Prerequisites
- Node.js (v18+)
- Windows PowerShell (v5.1+)
- WSL2 (Ubuntu 24.04 recommended for OpenClaw)
- SQLite3

## 1. Installation
Clone the repository, ensuring it resides strictly on your local filesystem.
```bash
npm install
```

## 2. Configuration
You must configure the root paths inside `server/config.ts`. Ensure your Obsidian Second Brain paths and OpenClaw Automation roots map to your actual filesystem.
- Setup your `.env` securely for PowerShell consumption.

## 3. Database Initialization
Start the backend once to auto-create the SQLite tables:
```bash
npm run server
```
Then, you can seed your database via the `Setup Guide` page in the dashboard.

## 4. Run Services
Run both frontend and backend concurrently:
```bash
npm run dev:all
```

## 5. External Gateways
To use Heavy AI Jobs, ensure the WSL OpenClaw Gateway is active:
```bash
openclaw gateway run --port 18789
```

## 6. Verification
Run the system diagnostic suite to ensure everything is connected:
```powershell
& "$env:USERPROFILE\OpenClawAutomation\Test-Local AI-System.ps1"
```


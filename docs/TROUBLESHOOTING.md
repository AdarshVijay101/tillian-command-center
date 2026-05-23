# Troubleshooting

## Duplicate Dev Servers
**Issue:** `EADDRINUSE` or frozen dashboard because Vite/Express is locked.
**Resolution:** Run the killer script:
```powershell
C:\Users\kadar\OpenClawAutomation\Stop-Tillian-Duplicate-DevServers.ps1
```

## Backend Not Responding
**Issue:** The dashboard loads but displays offline alerts globally.
**Resolution:** Ensure `npm run server` is running. Check your `.env` for syntax errors. Verify `HOST` is `127.0.0.1`.

## OpenClaw Gateway Offline
**Issue:** System Doctor warns that OpenClaw is offline. Heavy jobs fail.
**Resolution:** Start the gateway manually in WSL:
```bash
openclaw gateway run --port 18789
```
This is a Degraded State—Tillian will still send Telegram routines perfectly fine.

## SQLite Database Locked
**Issue:** `SQLITE_BUSY: database is locked`.
**Resolution:** Restart the Node.js backend. Avoid manual SQLite CLI edits while the server is actively polling.

## Scheduler Tasks Failing
**Issue:** Reminders are not sending.
**Resolution:** Check the `Scheduler` page in Tillian and use the Auto-Repair Console.

## Artifact Preview Blocked
**Issue:** Files in the Review Inbox cannot be previewed.
**Resolution:** Tillian enforces absolute path containment. Ensure the files actually reside inside `PATHS.processedFolder` defined in `server/config.ts`.

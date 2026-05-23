# Release Checklist

This document ensures Tillian Command Center is ready for a safe public GitHub release.

## Final Checks
- [x] Backend local only (bound to `127.0.0.1`)
- [x] Databases ignored (`tillian.db`, `*.db-wal`, etc.)
- [x] Action ledgers ignored (`action-runs.json`)
- [x] `.env` files ignored
- [x] No secrets in tracked files
- [x] Demo mode available and non-mutating
- [x] Read-only preview enforced
- [x] Evidence markdown redacts local paths
- [x] Scheduler repair allowlisted
- [x] Heavy jobs approval gated
- [x] OpenClaw offline handled as degraded gracefully
- [x] Documentation complete
- [x] Demo script ready

## Validation Commands
Run these inside PowerShell to guarantee your build is perfectly safe:
```powershell
cd "D:\DATA ENGINEER\PROJECTS\tillian-command-center"
npm run build
& "$env:USERPROFILE\OpenClawAutomation\Test-Tillian-System.ps1"
& "$env:USERPROFILE\OpenClawAutomation\Test-Tillian-Release-Readiness.ps1"
```

## Known Warnings
- OpenClaw Offline is intentionally treated as a `WARNING` (Degraded Mode), not a failure, because Tillian's core routing engine remains operational for essential scripts.

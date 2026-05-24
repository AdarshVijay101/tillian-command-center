# Safety Model

Local AI Command Center is built with strict isolation boundaries to ensure safe local execution.

## Localhost-Only Bound
- The backend Express server exclusively binds to `127.0.0.1`. It refuses to bind to `0.0.0.0`, preventing LAN or external access.

## Allowlisted Execution
- Local AI does not evaluate arbitrary strings or shell inputs.
- All PowerShell executions are strictly matched against a static map defined in `server/config.ts`.

## Read-Only Previews
- The Artifact Review Inbox allows you to read files but strictly refuses to delete, overwrite, or mutate source files.

## Secrets and Authentication
- There is no cloud database or remote SaaS integration in the Command Center.
- API keys, tokens, and Telegram identifiers never touch the Express or React code. They remain isolated in `.env` files exclusively read by Windows PowerShell.
- `Local AI.db` and log files are heavily guarded by `.gitignore`.

## Preflight Approval
- Heavy AI jobs do not execute automatically. They queue safely and require manual, human-in-the-loop preflight approval.

## Demo Mode
- The `/api` endpoints contain a global interception layer when Demo Mode is active.
- This layer guarantees that state, configurations, file systems, and underlying job queues are entirely shielded from mutation during employer or portfolio presentations.


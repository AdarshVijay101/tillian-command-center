# Demo Script

Tillian Command Center includes a safe, non-mutating Demo Mode that is perfect for portfolio presentations and employer walkthroughs. When Demo Mode is active, the frontend mocks API payloads to simulate a live, highly-active system without ever hitting real directories or exposing actual scheduled task paths.

## 5-Minute Employer Demo
1. **Goal**: Showcase aesthetic UI, core AI operations, and fundamental software engineering principles.
2. **Action**: Open Tillian at `http://localhost:5173`. Toggle **Demo Mode** ON from the Topbar.
3. **Walkthrough**:
   - Start at the `Mission Control` dashboard. Explain how Tillian replaces disorganized CLI scripts with a cohesive visual command center.
   - Navigate to the `Check-in` system to demonstrate protocol-aware execution tracking (how the AI ensures you actually complete specific human routines).
   - Jump to the `Release` page to prove your knowledge of local-first safety boundaries, path redaction, and strict repository hygiene.

## 10-Minute Technical Deep Dive
1. **Goal**: Demonstrate the underlying backend architecture, safety boundaries, and queuing mechanics.
2. **Action**: Keep Demo Mode ON.
3. **Walkthrough**:
   - Show the `Jobs Queue` page to explain pre-flight, human-in-the-loop gating for heavy AI tasks. Explain that the AI cannot run arbitrary commands without human approval.
   - Go to the `Review Inbox` to show how AI markdown outputs are securely indexed in a local Drop folder instead of directly modifying source files.
   - Select an artifact and generate an `Evidence Package` in the `Evidence` tab. Prove how local Windows file paths are dynamically redacted into `[REDACTED_LOCAL_PATH]`.
   - Open the `Reliability` and `Setup Guide` (System Doctor) pages to demonstrate continuous integration testing and automated health polling of your background systems.

## Degraded / Failure-Mode Demo
1. **Goal**: Prove resilience and graceful error handling.
2. **Action**: Turn Demo Mode OFF. Intentionally kill the WSL OpenClaw Gateway or let the `System Doctor` run while WSL is down.
3. **Walkthrough**:
   - Demonstrate that Tillian gracefully degrades, labeling systems as "Offline" rather than crashing the React frontend or failing to load the dashboard.
   - Explain how essential daily protocols (like standard Telegram Reminders) are structurally isolated from Heavy AI jobs, meaning the critical path survives even if the AI backend is unreachable.

## Talking Points
- **Local-First Priority**: Emphasize that Tillian isn't a SaaS wrapper. It's a localized infrastructure designed to guard privacy.
- **Human-in-the-Loop**: Highlight the Job Queue and Inbox as conscious design choices against autonomous, rogue AI execution.
- **PowerShell Abstraction**: Point out that React and Express don't know the secrets; only the isolated `.env` running in Windows Scheduled Tasks has access to the actual API keys.

## What Not To Show Publicly
- Do not show your actual `.env` file containing Telegram or OpenAI keys.
- Do not show raw SQLite rows containing unredacted absolute paths or personal identifiers.
- Do not open the raw `action-runs.json` log on screen during a presentation if it contains raw chat IDs.

## Final Close
End the presentation on the `Release` page, pointing out the 100/100 Readiness Score. This demonstrates that not only can you build visually impressive AI tools, but you can build them with enterprise-grade CI/CD verification and security in mind.

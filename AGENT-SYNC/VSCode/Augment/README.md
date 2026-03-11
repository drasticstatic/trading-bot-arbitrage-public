# VSCode Augment Export Bundle

Private/internal handoff package for `trading-bot_arbitrage_DAPPUv3_hardhat_UNI-CAKE`.

- Export source: VSCode Augment chat context
- Export date: 2026-03-08
- Intended readers: Augment Intent, future VSCode Augment chats, delegated agents
- Scope: this repo only

## Privacy and handling

- This folder is for private repo reuse only.
- Do not copy this bundle into public repos or preview/export pipelines.
- Do not add secrets, `.env` contents, private keys, seed phrases, wallet files, or keystore material.
- Treat all operational notes here as internal.

## Reading order

1. `INTENT_COORDINATOR_SUMMARY.md` — shortest orientation for Kavanah / next coordinator
2. `FAST_START_HANDOFF.md` — what to do next and where to begin
3. `ARCHITECTURE_AND_OPERATIONS.md` — bot / contract / Hardhat / frontend runtime map
4. `STATUS_AND_RISKS.md` — completed work, blockers, validation gaps, known risks
5. `FILE_MAP_AND_EDIT_GUIDE.md` — notable files and edit starting points
6. `SESSION_HISTORY_DELTA.md` — concise history of what this chat accomplished and the latest wave delta

## Current snapshot

- Repo is private and Arbitrum-focused.
- Smart contract path is `contracts/Arbitrage.sol` using Balancer flash loans.
- Bot entrypoint is `bot.js` with WebSocket updates on port `5050`.
- Frontend is Vite + React + Redux under `frontend/`.
- Hyperliquid perp data support was added via `helpers/perpDex.js` and wired into screener updates.
- Current active issue is runtime / data-flow stability: frontend connected to WebSocket but recently showed `screenerPairs: 0` and `perpStatus: null` while an earlier runtime also hit a Hardhat/Node out-of-memory failure during repeated `evm_mine` activity.

## Confidence notes

- High confidence on code structure, recent changes, and current likely problem areas.
- Medium confidence on the exact live frontend state after the most recent bot restart because browser confirmation was still pending.
- No secrets were read for this export.

## Related repo-local context files

- `specs/KAVANAH_INTENT_SPEC.md` — current repo-local Intent spec placeholder
- `AGENT-SYNC/POINTER.md` — pointer to the hub repo coordination model
- `AGENT-SYNC/CROSS_REPO_RULES.md` — cross-repo privacy and agent coordination rules
- `PROGRESS.md` — older progress tracker with backlog and prior milestones

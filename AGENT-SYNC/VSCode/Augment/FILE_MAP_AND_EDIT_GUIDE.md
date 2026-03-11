# File Map and Edit Guide

## Core backend files

### `bot.js`

Primary orchestration file.

Start here when working on:

- screener loop behavior
- WebSocket broadcast payloads
- fork mining / freshness logic
- execution flow and trade lifecycle
- redeploy-after-reset behavior
- wallet broadcast behavior

Key sections worth locating first:

- `checkAllPrices()`
- `mineLocalBlockIfSupported()`
- `restartBot()`
- startup `main()`
- trade execution flow / trade-step broadcasting

### `helpers/perpDex.js`

Start here when working on:

- Hyperliquid connection/init failures
- spot-to-perp symbol coverage
- funding-rate caching
- spread calculations
- provider expansion beyond Hyperliquid

### `helpers/server.js`

Start here when working on:

- WebSocket server behavior
- client broadcast fanout
- server lifecycle issues

## Contract files

### `contracts/Arbitrage.sol`

Current production-relevant arbitrage contract.

Start here when working on:

- Balancer flashloan callback flow
- router whitelist policy
- pause/owner controls
- contract-level trade safety gates

### `boiler plates/flashloan-masterclass-leverage-2026_02-19/contracts/Position.sol`

Reference-only for now.

Borrow patterns from here for:

- Aave supply/borrow/repay/withdraw flows
- leverage lifecycle helpers
- health-factor monitoring concepts

Do not treat it as a drop-in replacement for `Arbitrage.sol`.

## Frontend files

### `frontend/src/store/websocket.js`

Start here when working on:

- WebSocket URL logic
- message-type routing
- reconnect behavior
- `SCREENER_UPDATE` dispatch confirmation

### `frontend/src/store/botSlice.js`

Start here when working on:

- Redux state shape for screener/perp data
- reducer bugs causing stale or empty UI

### `frontend/src/components/ScreenerPanel.jsx`

Start here when working on:

- main screener table rendering
- spot/perp display columns
- opportunity visibility and UX

### `frontend/src/components/PerpOpportunitiesPanel.jsx`

Start here when working on:

- perp-specific UI
- funding heatmap
- delta-neutral calculator
- temporary debug log cleanup after root cause is fixed

### `frontend/src/App.jsx`

Start here when changing page layout / panel composition.

## Test and utility files

### `test/Arbitrage.js`

Primary contract behavior tests.

### `test/calculatePrice.test.js`

Helper/math coverage for price calculations.

### `scripts/reset-fork.js`

Use when checking fork reset assumptions and contract redeploy behavior.

### `scripts/manipulate.js` and `scripts/quick-manipulate.js`

Useful for creating controlled local arbitrage conditions on the fork.

## Coordination files

### `specs/KAVANAH_INTENT_SPEC.md`

Current repo-local placeholder for Intent spec sync.

### `PROGRESS.md`

Older repo progress tracker; useful for backlog context but not fully up to date with the latest live debugging/export wave.

### `AGENT-SYNC/VSCode/Augment/*`

This export bundle is the current private bridge from this VSCode Augment chat into future Intent/agent sessions.

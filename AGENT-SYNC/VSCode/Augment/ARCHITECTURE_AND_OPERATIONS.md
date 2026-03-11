# Architecture and Operations

## Runtime topology

### Backend / bot

- Entrypoint: `bot.js`
- Starts the WebSocket/HTTP server through `helpers/server.js`
- Broadcasts bot state, screener data, wallet info, trade status, and analysis results to the frontend
- Main screener loop runs on a periodic interval and calls `checkAllPrices()`

### Local chain / testing environment

- Hardhat local fork on `localhost:8545`
- Local fork freshness is tracked in the bot and recent UI work
- Bot can mine local blocks via `evm_mine`
- `hardhat_reset` clears manipulated state but also wipes deployments, so the bot contains redeploy logic for the arbitrage contract

### Contract layer

- Main contract: `contracts/Arbitrage.sol`
- Uses Balancer V2 Vault flash loans
- Supports two-swap arbitrage path execution
- Restricts usage to whitelisted routers
- Includes owner-only execution, pause, emergency withdraw, and 2-step ownership transfer

### Frontend

- App root in `frontend/src/App.jsx`
- WebSocket client in `frontend/src/store/websocket.js`
- Redux slice in `frontend/src/store/botSlice.js`
- Main live monitoring areas include screener, trade execution, logs, and perp opportunities

### Perp data layer

- Helper: `helpers/perpDex.js`
- Current provider: Hyperliquid via CCXT
- Responsibilities:
  - initialize perp exchange connectivity
  - map spot symbols to perp symbols
  - fetch perp prices and funding rates
  - cache recent perp data
  - calculate spot-perp spreads
  - expose `perpStatus` for UI display

## Data flow

1. Bot initializes trading pairs and perp connector.
2. `checkAllPrices()` collects spot prices across DEXs.
3. Bot fetches perp prices/funding for matching symbols.
4. Bot enriches screener rows with perp and funding data.
5. Bot broadcasts `SCREENER_UPDATE` with:
   - `pairs`
   - `block`
   - `timestamp`
   - `threshold`
   - `fork`
   - `perpStatus`
6. Frontend WebSocket client dispatches `updateScreener(payload)`.
7. Screener and perp panels render from Redux state.

## Relevant scripts and commands

- Root start: `npm start`
- Root build: `npm run build`
- Frontend dev: `npm --prefix frontend run dev`
- Tests: `npx hardhat test`
- Fork reset helper: `scripts/reset-fork.js`
- Price/debug helpers: `scripts/debug-prices.js`, `scripts/manipulate.js`, `scripts/quick-manipulate.js`

## Current operational caveats

- Repeated local mining appears capable of contributing to memory pressure or runaway runtime behavior.
- A previous runtime showed a Node/Hardhat out-of-memory failure after heavy `evm_mine` activity.
- The frontend issue is likely downstream of runtime/data flow stability, not obviously a broken reducer or WebSocket URL.
- Hyperliquid integration is currently data/monitoring only; authenticated perp execution is blocked by missing user account/API credentials.
- Some desired perp symbols are not available on Hyperliquid, so certain spot pairs will never receive perp matches under the current provider.

## Flashloan boilerplate comparison outcome

The instructor folder `boiler plates/flashloan-masterclass-leverage-2026_02-19` is useful as reference, but not as a replacement for the current core arbitrage contract.

- Current repo strength: direct Balancer flashloan spot arbitrage on Arbitrum
- Boilerplate strength: Aave-based leveraged position lifecycle

Best use of that boilerplate in this repo:

- future leveraged/delta-neutral experiments
- Aave health factor / debt monitoring patterns
- optional separate module, not a replacement for `Arbitrage.sol`

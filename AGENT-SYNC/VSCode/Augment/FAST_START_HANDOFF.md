# Fast Start Handoff

## What this repo is

Private DEX arbitrage bot targeting Arbitrum, tested on a Hardhat local fork.

- Spot arbitrage execution: Balancer flash loans + router-based swaps
- Executable DEXs: Uniswap V3, PancakeSwap V3, SushiSwap V3
- Scan-only DEX currently present: Camelot
- Frontend: React + Redux + WebSocket dashboard
- Perp monitoring: Hyperliquid via CCXT for spot-perp spreads and funding rates

## Immediate next priorities

1. Fix the screener/perp data flow so the frontend reliably receives `SCREENER_UPDATE`.
2. Investigate and reduce runtime instability around repeated local mining / memory growth.
3. Remove temporary debug logging from `frontend/src/components/PerpOpportunitiesPanel.jsx` after the root cause is confirmed.
4. Re-validate with targeted checks:
   - `npx hardhat test`
   - `npm run build`
   - live bot + frontend smoke check

## What just happened in the latest wave

- Perp integration was added and previously validated by tests/builds.
- User reported frontend stuck at `Loading pairs...` and perp panel offline.
- Browser console showed WebSocket connected, but Redux state still had:
  - `screenerPairs: 0`
  - `perpStatus: null`
- Code review confirmed frontend WebSocket wiring is correct.
- Runtime logs showed an earlier process hit out-of-memory after excessive repeated `evm_mine` activity.
- After restart, the bot logged healthy initialization again:
  - 21 trading pairs initialized
  - 16 perp prices fetched
  - screener active across 4 DEXs
- Most likely diagnosis: operational/runtime issue rather than simple frontend render bug.

## Recommended first read/edit targets

- `bot.js`
  - `checkAllPrices()`
  - local fork mining logic
  - broadcast path for `SCREENER_UPDATE`
- `frontend/src/store/websocket.js`
  - message routing for `SCREENER_UPDATE`
- `frontend/src/store/botSlice.js`
  - screener state reducer
- `frontend/src/components/PerpOpportunitiesPanel.jsx`
  - temporary debug logs to remove after fix
- `helpers/perpDex.js`
  - perp fetch/cache/status logic

## Practical operator assumptions

- Local Hardhat fork is part of the normal workflow.
- `hardhat_reset` wipes local deployments, so the bot auto-redeploy path matters.
- Perp trading execution is not live yet because the user does not currently have a Hyperliquid account.
- Wallet funding on Arbitrum may still be a practical blocker for non-simulated live paths.

## Minimal safe validation flow

1. Confirm Hardhat node on `8545`
2. Confirm bot on `5050`
3. Start/refresh frontend
4. Watch for non-empty `SCREENER_UPDATE` payloads
5. Run `npx hardhat test`
6. Run `npm run build`

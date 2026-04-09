# Go/No-Go Criteria — DAppU DEX Arbitrage Bot (Arbitrum)

This document defines the pre-flight checklist and stage transition criteria for deploying the arbitrage bot from monitor-only observation through manual execution to guarded automation on Arbitrum.

**Guiding principle: when in doubt, stay in monitor mode.**

## Section 1: Pre-Flight Checklist (Monitor-Only Launch)

Complete every item before starting the bot in monitor mode on Arbitrum.

### Environment

- [ ] Node.js LTS installed (via NVM recommended)
- [ ] `npm install` completed without errors
- [ ] `npm run build` succeeds (frontend build)
- [ ] `npx hardhat test` passes all tests

### Configuration

- [ ] `.env` configured with `ALCHEMY_API_KEY` (Arbitrum RPC access)
- [ ] `.env` does NOT contain `PRIVATE_KEY` (not needed for monitor-only — remove or leave blank to be safe)
- [ ] `config.json` → `PROJECT_SETTINGS.isLocal`: `false`
- [ ] `config.json` → `PROJECT_SETTINGS.isDeployed`: `false`
- [ ] `config.json` → `tradingMode`: `"monitor"`
- [ ] `BOT_API_TOKEN` set in `.env` (recommended) or running localhost-only

### Startup Verification

- [ ] `node bot.js` starts without errors
- [ ] Console shows: `Trading mode: MONITOR`
- [ ] No `ERROR`-level log entries at startup
- [ ] Dashboard loads at `http://localhost:5050`
- [ ] Screener panel shows live Arbitrum price feeds after ~5s
- [ ] No execution attempts in logs — any attempt should show: `Trade blocked: tradingMode is "monitor"`

### Safety Gate Verification

The following safety mechanisms (M1–M6) must be confirmed operational:

| Gate | Description | How to verify |
| --- | --- | --- |
| M1 | Trading mode gate | tradingMode: "monitor" blocks all execution paths in bot.js |
| M2 | Environment separation | Missing PRIVATE_KEY on mainnet forces fallback to monitor mode |
| M3 | Force-execute confirmation | Mainnet force-execute requires user confirmation + loss cap |
| M4 | Auto-execute gate | Mainnet auto-execute only fires when tradingMode: "auto" + rate limiter |
| M5 | Amount safety | Null/zero amounts rejected; trade amount capped by maxTradeAmountToken0 |
| M6 | API auth | CORS locked to localhost; REST POST requires bearer token; WebSocket auth for non-read commands |

## Section 2: Stage Transition Criteria

### Monitor → Manual (Stage 1 → Stage 3)

**All conditions must be met before switching to manual mode.**

#### Observation Period (minimum 24 hours in monitor mode)

- [ ] Screener has identified ≥5 opportunities with spread above configured threshold (`PRICE_DIFFERENCE`)
- [ ] Price feeds are stable — no stale data or connection drops for >1 hour continuous
- [ ] Gas estimates displayed in dashboard are reasonable vs actual Arbitrum gas prices
- [ ] Dashboard has been stable for the full observation period (no crashes, no memory leaks)
- [ ] No `ERROR`-level entries in logs during observation

#### Contract Deployment

- [ ] Arbitrage contract deployed to Arbitrum (`npx hardhat ignition deploy ... --network arbitrum`)
- [ ] Contract verified on Arbiscan (`npx hardhat verify --network arbitrum <address>`)
- [ ] `owner()` on Arbiscan returns your wallet address
- [ ] `config.json` → `ARBITRAGE_ADDRESS` updated to deployed contract address

#### Wallet & Funding

- [ ] Dedicated Arbitrum wallet funded with conservative amount (0.01–0.05 ETH max)
- [ ] `PRIVATE_KEY` set in `.env` (the funded wallet's key)
- [ ] Wallet is NOT the Hardhat test wallet

#### Config Changes

- [ ] `config.json` → `PROJECT_SETTINGS.isDeployed`: `true`
- [ ] `config.json` → `tradingMode`: `"manual"`
- [ ] `config.json` → `maxTradeAmountToken0`: `"0.01"` (start small)
- [ ] `config.json` → `maxForceExecuteLoss`: `"0.0005"` (tight loss cap)

#### Post-Switch Verification

- [ ] Console shows: `Trading mode: MANUAL`
- [ ] Console shows: `LIVE TRADING MODE ACTIVE` warning
- [ ] Dashboard Execute button is functional (triggers confirmation on mainnet — M3)
- [ ] Auto-execute is NOT active (requires `tradingMode: "auto"`)

### Manual → Auto (Stage 3 → Stage 4)

**All conditions must be met before switching to auto mode.**

#### Track Record (minimum 48 hours in manual mode)

- [ ] ≥5 successful manual trades with positive P&L
- [ ] No failed transactions or unexpected contract reverts
- [ ] Slippage within expected bounds on all trades
- [ ] Gas costs consistently below profit threshold
- [ ] Dashboard monitoring stable for ≥48 hours
- [ ] Trade history in `data/trade_history.json` is accurate and complete

#### Config Changes

- [ ] `config.json` → `tradingMode`: `"auto"`
- [ ] `config.json` → `maxAutoTradesPerHour`: `5` (conservative start)
- [ ] `config.json` → `maxTradeAmountToken0`: `"0.05"` (still small)
- [ ] Dashboard Settings → Auto Execute: ON

#### Post-Switch Verification

- [ ] Console shows: `Trading mode: AUTO`
- [ ] Rate limiter active: logs show `Auto-trade count this hour: N/5`
- [ ] Auto-execute fires only when spread exceeds threshold
- [ ] Rate limit cap respected: `Auto-execute paused: 5/5 trades this hour (limit reached)`

## Section 3: No-Go Signals (Stop and Investigate)

If ANY of these occur, immediately revert to monitor mode. See [Section 4: Rollback](#section-4-rollback-procedures) below.

### Critical (Immediate Stop)

- **Unexpected transaction revert** — any revert that was not anticipated during analysis
- **Unauthorized API access** in logs — any request that bypasses M6 auth
- **Contract ownership change** — `owner()` returns unexpected address
- **Private key compromise suspected** — any sign of unauthorized wallet activity

### Warning (Investigate Within 1 Hour)

- **Price feed staleness** >5 minutes — screener not updating
- **Gas price spike** >3x normal Arbitrum gas — unprofitable trades likely
- **Dashboard disconnection** during active trading — loss of monitoring capability
- **P&L negative** after ≥3 consecutive trades — strategy may not be viable
- **Wallet balance draining faster than expected** — gas costs exceeding profits

### Informational (Monitor Closely)

- Single trade with unexpected slippage
- Intermittent RPC connection errors (may self-resolve)
- Pool liquidity drop on a single pair

## Section 4: Rollback Procedures

Cross-reference: [RUNBOOK.md](./RUNBOOK.md) — Emergency Procedures section

### Immediate Rollback (Any Stage → Monitor)

1. Edit `config.json`: set `tradingMode` to `"monitor"`
2. Restart the bot: `Ctrl+C` then `node bot.js`
3. All execution paths are blocked immediately (M1 gate)

### If Trades Are In Flight

1. **Pause the contract** on Arbiscan: call `setPaused(true)` (owner-only)
2. Wait for any pending transactions to confirm or fail
3. Set `tradingMode: "monitor"` and restart

### Emergency Fund Recovery

1. **Withdraw ERC-20 tokens**: Arbiscan → `emergencyWithdraw(<token_address>)` (owner-only)
2. **Withdraw ETH**: Arbiscan → `emergencyWithdrawETH()` (owner-only)
3. Both functions send all funds to the contract owner

### Kill the Bot Process

```bash
# Direct:
Ctrl+C

# pm2:
pm2 stop bot

# systemd:
sudo systemctl stop arbitrage-bot
```

### Contract Ownership Transfer (Two-Step)

1. Current owner calls: `transferOwnership(<new_address>)`
2. New owner calls: `acceptOwnership()`
3. Ownership does not change until step 2 completes

## Appendix: Safety Gate Reference

| Gate | Code Location | What It Does |
| --- | --- | --- |
| M1 | bot.js — getTradingMode(), analyzeAndExecute(), executeTrade() | Blocks all execution when tradingMode === "monitor" |
| M2 | bot.js — main() startup | Checks PRIVATE_KEY on mainnet; falls back to monitor if missing |
| M3 | bot.js — EXECUTE_TRADE handler, CONFIRM_FORCE_EXECUTE handler | Mainnet force-execute requires user confirmation; loss capped by maxForceExecuteLoss |
| M4 | bot.js — checkAllPrices() auto-execute block | Mainnet auto-execute gated to tradingMode: "auto" + rolling hourly rate limit |
| M5 | bot.js — executeTrade() | Rejects null/zero amounts; caps trade size to maxTradeAmountToken0 |
| M6 | helpers/server.js — auth middleware, WebSocket handler | CORS locked to localhost; REST POST requires bearer token; WS commands require auth |
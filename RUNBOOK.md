# Production Runbook — DAppU DEX Arbitrage Bot (Arbitrum)

This runbook covers staged deployment of the arbitrage bot from local testing through monitor-only observation to live execution on Arbitrum. Follow the stages in order — do not skip ahead.

## Prerequisites

- **Node.js** (LTS recommended, via NVM)
- **Hardhat** (`npx hardhat --version` should work after `npm install`)
- **npm dependencies** installed (`npm install`)
- **Alchemy account** with an Arbitrum API key (or any Arbitrum RPC endpoint)
- **Dedicated Arbitrum wallet** — NOT the Hardhat test wallet
- **Frontend build** — run `npm run build` once before starting

> Security reminder: Never commit .env, private keys, seed phrases, or keystore files. All secrets stay in .env (gitignored) or your local environment only.

## Stage 0: Local Verification

Confirm everything works on the local Hardhat fork before touching mainnet.

### 0.1 Start Hardhat Node

```bash
npx hardhat node
```

### 0.2 Deploy Contract Locally

```bash
npx hardhat ignition deploy ignition/modules/Arbitrage.js --network localhost
```

Update `config.json` → `PROJECT_SETTINGS.ARBITRAGE_ADDRESS` if the deployed address differs from the current value.

### 0.3 Run Tests

```bash
npx hardhat test
```

All tests must pass before proceeding.

### 0.4 Start the Bot

```bash
node bot.js
```

### 0.5 Verify Dashboard

Open `http://localhost:5050` in a browser. Confirm:

- Screener panel loads and shows pairs after ~5s cold start
- Perp panel shows data or expected "n/a" for unavailable markets
- Settings panel is accessible and responsive

### 0.6 (Optional) Test Execution Locally

```bash
npx hardhat run scripts/quick-manipulate.js --network localhost
```

Watch the bot detect the price manipulation and (if `tradingMode` is "manual" or "auto") execute a trade.

## Stage 1: Monitor-Only on Arbitrum

The bot observes real Arbitrum prices without any execution capability.

### 1.1 Configure `config.json`

```json
{
  "PROJECT_SETTINGS": {
    "isLocal": false,
    "isDeployed": false
  },
  "tradingMode": "monitor"
}
```

Key points:

- `isLocal: false` — connects to real Arbitrum via WebSocket RPC
- `isDeployed: false` — prevents any contract interaction
- `tradingMode: "monitor"` — hard-blocks all execution paths in `bot.js`

### 1.2 Configure `.env`

Set these values in your `.env` file (see `.env.example` for the template):

- `ALCHEMY_API_KEY` — your Arbitrum Alchemy key
- `PRIVATE_KEY` — your wallet key (used only for balance reads in monitor mode)
- `BOT_API_TOKEN` — a random secret string for API auth (optional in monitor mode, recommended)

### 1.3 Start the Bot

```bash
node bot.js
```

### 1.4 What to Look For

- Console shows `Trading mode: MONITOR` at startup
- Screener updates arrive (SCREENER_UPDATE log entries)
- Dashboard at `http://localhost:5050` shows live Arbitrum pair prices
- Spread data appears for configured pairs
- No execution attempts logged (any attempt should show "Trade blocked: tradingMode is monitor")

### 1.5 How Long to Monitor

Run monitor mode for at least a few hours (ideally a full day) to observe:

- How often meaningful spreads appear
- Whether screener updates are stable
- Gas costs on Arbitrum (visible in profitability estimates)
- Dashboard stability over extended periods

## Stage 2: Contract Deployment

### 2.1 Deploy to Arbitrum

Ensure `.env` has `PRIVATE_KEY` set to your funded deployment wallet.

```bash
npx hardhat ignition deploy ignition/modules/Arbitrage.js --network arbitrum
```

### 2.2 Verify on Arbiscan

```bash
npx hardhat verify --network arbitrum <CONTRACT_ADDRESS>
```

### 2.3 Confirm Ownership

On Arbiscan, call the `owner()` read function on your contract. It must return your wallet address.

### 2.4 Update Config

Set `ARBITRAGE_ADDRESS` in `config.json` to the newly deployed contract address:

```json
{
  "PROJECT_SETTINGS": {
    "ARBITRAGE_ADDRESS": "<your_deployed_contract_address>"
  }
}
```

### 2.5 Fund the Contract

The contract uses Balancer flash loans, so it does not need token capital. However, your **wallet** needs ETH for gas. Start with **0.01–0.05 ETH** maximum.

## Stage 3: Manual Tiny-Capital Execution

### 3.1 Configure `config.json`

```json
{
  "PROJECT_SETTINGS": {
    "isLocal": false,
    "isDeployed": true
  },
  "tradingMode": "manual",
  "maxTradeAmountToken0": "0.01",
  "maxForceExecuteLoss": "0.0005"
}
```

Key safety fields:

- `tradingMode: "manual"` — execution only via explicit dashboard button clicks
- `maxTradeAmountToken0: "0.01"` — caps flash loan borrow to a tiny amount
- `maxForceExecuteLoss: "0.0005"` — blocks force-execute if estimated loss exceeds this (in token0 units)

### 3.2 Start the Bot

```bash
node bot.js
```

Confirm startup log shows: `Trading mode: MANUAL`

### 3.3 Using the Dashboard

1. Open `http://localhost:5050`
2. Use **Analyze** on individual pairs to review profitability data
3. Only click **Execute** when you see a genuinely profitable opportunity
4. On mainnet, force-execute requires a **confirmation step** (M3 safety gate) — you'll be prompted to confirm
5. Monitor results in the dashboard **History** tab and in `data/trade_history.json`

### 3.4 Success Criteria Before Moving to Stage 4

- Successfully executed at least 3–5 manual trades
- Understand gas costs vs. profit margins
- No unexpected errors or contract reverts
- Trade history saved correctly

## Stage 4: Guarded Automation

**Only proceed after Stage 3 success.**

### 4.1 Configure `config.json`

```json
{
  "tradingMode": "auto",
  "maxAutoTradesPerHour": 5,
  "maxTradeAmountToken0": "0.05"
}
```

### 4.2 Enable Auto-Execute in Dashboard

In the dashboard Settings panel, toggle **Auto Execute** on.

### 4.3 Monitor

- Watch the Activity log for auto-execute entries
- The bot enforces a rate limiter: max `maxAutoTradesPerHour` trades per rolling hour
- If the limit is reached, you'll see: `Auto-execute paused: N/N trades this hour (limit reached)`
- Auto-execute on mainnet is hard-gated to `tradingMode: "auto"` only (M4 safety)

### 4.4 Scaling Up (Carefully)

Increase `maxTradeAmountToken0` and `maxAutoTradesPerHour` gradually based on observed profitability and gas economics. Never jump to large values without evidence.

## Emergency Procedures

### Pause the Contract (Immediate Stop)

On Arbiscan, call:

```
setPaused(true)
```

Owner-only. Blocks all trade execution at the contract level.

To resume: `setPaused(false)`

### Emergency Withdraw Tokens

On Arbiscan, call:

```
emergencyWithdraw(<token_address>)
```

Withdraws all of a specific ERC-20 token from the contract to the owner.

### Emergency Withdraw ETH

On Arbiscan, call:

```
emergencyWithdrawETH()
```

Withdraws all ETH from the contract to the owner.

### Kill the Bot Process

```bash
# If running directly:
Ctrl+C

# If running via pm2:
pm2 stop bot

# If running via systemd:
sudo systemctl stop arbitrage-bot
```

### Revert to Monitor Mode

Edit `config.json`:

```json
{ "tradingMode": "monitor" }
```

Restart the bot. All execution paths are blocked immediately.

### Transfer Contract Ownership

Two-step process (prevents accidental transfers):

1. Current owner calls: `transferOwnership(<new_address>)`
2. New owner calls: `acceptOwnership()`

Ownership does not change until step 2 completes.

## Monitoring Checklist

Run through this periodically during live operation:

- [ ] Dashboard loads at `http://localhost:5050` and shows live data
- [ ] Wallet balance displayed in dashboard (check for unexpected drain)
- [ ] Console/logs show periodic `SCREENER_UPDATE` activity
- [ ] No `ERROR`-level log entries
- [ ] Trade history saving to `data/trade_history.json`
- [ ] Auto-trade counter is within expected bounds (if Stage 4)
- [ ] Contract is not paused (unless intentionally)
- [ ] Gas costs per trade are within acceptable range

## Config Reference

### `config.json` — Top-Level Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| tradingMode | string | "monitor" | "monitor" / "manual" / "auto" — controls execution gating |
| maxForceExecuteLoss | string | "0.001" | Max acceptable loss (in token0 units) for force-execute on mainnet |
| maxAutoTradesPerHour | number | 5 | Rate limit for auto-execution per rolling hour |
| maxTradeAmountToken0 | string | "0.05" | Max flash loan borrow amount (in token0 units) |

### `config.json` — `PROJECT_SETTINGS`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| isLocal | boolean | true | true = Hardhat fork; false = real Arbitrum |
| isDeployed | boolean | true | true = contract calls enabled; false = monitor only |
| ARBITRAGE_ADDRESS | string | — | Deployed Arbitrage contract address |
| PRICE_UNITS | number | 4 | Decimal places for price display |
| PRICE_DIFFERENCE | number | 0.5 | Minimum spread (%) to trigger execution logic |
| GAS_LIMIT | number | 600000 | Gas limit for fee estimation (not used in tx submission) |
| GAS_PRICE | number | 0.00000001 | Gas price for fee estimation (not used in tx submission) |

### Environment Variables (`.env`)

| Variable | Required | Description |
| --- | --- | --- |
| ALCHEMY_API_KEY | Yes | Alchemy API key for Arbitrum RPC |
| PRIVATE_KEY | Yes (manual/auto) | Wallet private key for signing transactions |
| ARBITRUM_RPC_URL | No | Custom Arbitrum RPC URL (overrides Alchemy) |
| BOT_API_TOKEN | Recommended | Bearer token for REST API auth; if unset, only localhost allowed |
| CORS_ORIGIN | No | Allowed CORS origin (default: http://localhost:5050) |
| PORT | No | Server port (default: 5050) |
| FORK_BLOCK_NUMBER | No | Pin Hardhat fork to a specific block (local mode only) |
| AUTO_MINE_LOCAL_BLOCKS | No | 0 to disable local block mining (default: enabled) |
| VERBOSE_SPREAD_LOGS | No | 1 to enable detailed spread logging |
| FORK_MAINNET_BLOCK_POLL_MS | No | Mainnet block polling interval in ms (default: 30000) |
| FORK_REFORK_LAG_BLOCKS | No | Block lag threshold for refork warning (default: 50) |

## Process Management (Optional)

For persistent operation, consider running the bot under a process manager:

### pm2

```bash
npm install -g pm2
pm2 start bot.js --name arbitrage-bot
pm2 logs arbitrage-bot
pm2 stop arbitrage-bot
```

### systemd (Linux)

Create `/etc/systemd/system/arbitrage-bot.service` with your working directory and environment, then:

```bash
sudo systemctl enable arbitrage-bot
sudo systemctl start arbitrage-bot
sudo journalctl -u arbitrage-bot -f
```

## Rollback Procedure

If anything goes wrong at any stage:

1. **Set **`tradingMode: "monitor"` in `config.json` and restart
2. **Pause the contract** via Arbiscan if trades are in flight
3. **Emergency withdraw** any tokens/ETH stuck in the contract
4. **Review logs** in console output and `data/trade_history.json`
5. **Do not resume execution** until the root cause is understood

The guiding principle: **when in doubt, go back to monitor mode.**
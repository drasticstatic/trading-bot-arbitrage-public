## DAPPU Arbitrage Bot — Progress Tracker

Last updated: 2026-01-25

### Top goals
- Make profitable trades show real profit (trade history + wallet balances)
- Expand coverage (Camelot + eventually Balancer pools)
- Make auto-execute actually trigger when opportunities appear
- Improve UX (trade execution “terminal-like” splash modal)

### Current blockers / focus
1) **Restart Bot was wiping the deployed Arbitrage contract (hardhat_reset)**
   - Symptom: first run shows profit/confetti, but after clicking **Restart Bot** trades show `0.000000` profit and no confetti
   - Root cause: after `hardhat_reset`, the contract code at `PROJECT_SETTINGS.ARBITRAGE_ADDRESS` is gone; tx still “succeeds” but does nothing (no logs, no balance change)
   - Fix: bot now detects missing bytecode and auto-deploys Arbitrage again on localhost, refreshing the in-memory contract handle

2) **Mainnet trade tx failing: "Transaction reverted without a reason string"**
   - Likely cause: ERC20 tokens that return **no boolean** on `approve/transfer` causing ABI decode revert (empty revert data)
   - Fix in progress: switch Arbitrage.sol ERC20 interactions to “optional return” safe calls + bubble swap revert data
   - Impact: should convert silent reverts into actionable revert reasons and allow non-standard tokens to be approved/transferred

### Backlog / next improvements
- Add Balancer pools as a DEX source (pricing + quoting via `Vault.queryBatchSwap` or SOR)
- Execution splash modal (steps: flash loan -> swap1 -> swap2 -> repay -> profit)
- Safer auto-execute (cooldowns, max trades/minute, max loss, allowlist pairs)

### Completed (recent)
- ✅ **Two-fee execution (fee0/fee1)** - Contract and bot.js updated to support different fees per swap
- ✅ **Camelot/Algebra Swap event fix** - Added Swap event to IAlgebraPool ABI (was causing crash)
- ✅ **Trade history profit parsing** - Now parses TradeExecuted event from receipt logs
- ✅ **Auto-execute trigger** - Added in checkAllPrices() with 10-second cooldown
- ✅ **Restart Bot profit/confetti fix** - Auto-redeploy Arbitrage after hardhat_reset so trades emit events + profit is recorded
- ✅ **WebSocket port 5050** - Already configured correctly
- ✅ **WalletPanel mainnet balance** - Already displays both hardhat and mainnet balances
- Fixed 10 “could not decode result data” pairs (zero-address pool guard)
- Fixed astronomical WETH/WBTC spreads (token order + decimals handling)
- Added per-DEX error handling so one bad pool doesn’t remove whole pair
- Standardized `bot.js` formatting and ensured tests pass


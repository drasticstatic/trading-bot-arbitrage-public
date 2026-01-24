## DAPPU Arbitrage Bot — Progress Tracker

Last updated: 2026-01-24

### Top goals
- Make profitable trades show real profit (trade history + wallet balances)
- Expand coverage (Camelot + eventually Balancer pools)
- Make auto-execute actually trigger when opportunities appear
- Improve UX (trade execution “terminal-like” splash modal)

### Current blockers / focus
1) **Contract needs redeployment** ✅ CODE READY
   - Updated `Arbitrage.sol` to accept two separate fees (fee0, fee1)
   - Need to run: `npx hardhat ignition deploy ignition/modules/Arbitrage.js --network localhost`
   - Then update `config.json` with new contract address

### Backlog / next improvements
- Add Balancer pools as a DEX source (pricing + quoting via `Vault.queryBatchSwap` or SOR)
- Execution splash modal (steps: flash loan -> swap1 -> swap2 -> repay -> profit)
- Safer auto-execute (cooldowns, max trades/minute, max loss, allowlist pairs)

### Completed (recent)
- ✅ **Two-fee execution (fee0/fee1)** - Contract and bot.js updated to support different fees per swap
- ✅ **Camelot/Algebra Swap event fix** - Added Swap event to IAlgebraPool ABI (was causing crash)
- ✅ **Trade history profit parsing** - Now parses TradeExecuted event from receipt logs
- ✅ **Auto-execute trigger** - Added in checkAllPrices() with 10-second cooldown
- ✅ **WebSocket port 5050** - Already configured correctly
- ✅ **WalletPanel mainnet balance** - Already displays both hardhat and mainnet balances
- Fixed 10 “could not decode result data” pairs (zero-address pool guard)
- Fixed astronomical WETH/WBTC spreads (token order + decimals handling)
- Added per-DEX error handling so one bad pool doesn’t remove whole pair
- Standardized `bot.js` formatting and ensured tests pass


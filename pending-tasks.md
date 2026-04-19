# Pending Tasks (Visibility Mirror)

> Repo-visible snapshot for quick reference outside the Intent workspace. Primary planning remains in the live Intent spec and the richer workspace Pending Tasks note. This file is intentionally concise and may lag the live note.

## Current status — V1 Deploy-Ready (tagged `v1.0-deploy-ready`, 2026-04-19)

V1 is feature-complete and tagged. Blocking item before mainnet deploy is wallet funding.

**V1 feature set:**
- 6 pairs × 3 DEXes (Uniswap, PancakeSwap, Camelot) — 14 active combos after pool pre-check
- Camelot/Algebra protocol support (quoter + executable execution path)
- PRICE_UNITS=6, PRICE_DIFFERENCE=0.3% threshold
- Perp unit conversion fix (TOKEN/WETH symbol direction)
- MEV protection via Flashbots private RPC (`FLASHBOTS_RPC_URL` in config.json)
- Atomic `Arbitrage.sol` with Algebra branching and `require(profit > minProfit)` guard
- Live GMX/WETH spread observed at 0.42% (Uniswap↔Camelot) — near-threshold

## Pre-Mainnet Checklist (blocking)

- [ ] Fund wallet to 0.01+ ETH (currently 0.0014 ETH — enough to deploy, not enough for sustained trading)
- [ ] Deploy contract: `npx hardhat run scripts/deploy.js --network arbitrum`
- [ ] Add `ARBITRAGE_ADDRESS` to `.env` after deploy
- [ ] 24-hour monitor observation (GO_NOGO.md gate)
- [ ] Switch `tradingMode` to `execute`

## V2 Research — Rust/Alloy/REVM Low-Latency Path (2026-04-19)

Research via Gemini documents the professional MEV bot stack. Parked for post-V1. Key findings:

**Flashbots Protect on Arbitrum — known limitation:**
- Adds an extra network hop (latency penalty) — problematic on Arbitrum which is FCFS (first-come-first-served)
- Acceptable trade-off for V1 (sandwich protection outweighs latency cost at low frequency)
- Not competitive long-term against bots using direct sequencer submission

**Timeboost (Arbitrum's "express lane" auction):**
- ~0.001 ETH minimum bid per 60-second round = ~$90+/hour at current prices
- Winner gets 200ms head start over all other txs
- Skip until trading volume justifies the cost; monitor via Dune dashboard (entropy_advisors)

**Rust/Alloy/REVM rewrite — when V1 proves profitable:**
- Alloy-rs: successor to ethers-rs, ~60% faster U256 math, 10x faster ABI encoding via `sol!` macro
- REVM: local EVM fork — simulates trades in ~10μs vs ~50ms RPC round-trip
- tokio: async parallelism across hundreds of pool price updates simultaneously
- No GC pauses (vs Node.js/Python 10–50ms GC spikes that can miss a 250ms Arbitrum block)
- Recommended framework: Artemis (Paradigm) — Collectors → Strategy → Executor pipeline
- Reference: `https://www.paradigm.xyz/2025/05/introducing-alloy-v1-0`

**Recommended V2 stack:**
`Rust + Alloy-rs + REVM + Artemis + Dwellir/Chainstack low-latency RPC + Timeboost (when volume justifies)`

## Deferred / parked

- Wallet-connect decision work.
- Authenticated Hyperliquid execution (awaiting account access).
- Flashloan-masterclass / Aave-leverage strategy integration.
- Optional micro-follow-up: make `Settings updated` feedback copy human-readable (low priority).
- Rust/Alloy/REVM V2 rewrite — research complete, activate after V1 proves profitable.
- Timeboost auction participation — research complete, activate when hourly profit > ~$100.

## Production RPC (future)

- Upgrade Alchemy to Growth tier (330 CU/s) for sustained high-throughput monitoring
- Add secondary RPC fallback (public Arbitrum RPC as backup when primary is rate-limited)
- Implement RPC request batching (eth_call multicall) to reduce total call count
- Consider WebSocket subscriptions for price feeds instead of polling
- Switch back to WebSocket provider when on a paid RPC plan (lower latency, requires higher CU/s limit)
- Long-term: replace polling with direct Arbitrum Sequencer Feed subscription (Rust-only)

## Boundaries

- This mirror is secondary to the live Intent spec and workspace notes.
- It intentionally omits secrets, private coordination details, and sensitive strategy specifics.
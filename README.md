# DEX Arbitrage Bot — Frontend Demo

[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey?style=flat)](https://github.com/drasticstatic/.github)

A web dashboard for monitoring and executing cross-exchange arbitrage opportunities on Uniswap V3 and PancakeSwap V3. Detects price divergence between DEX pairs, estimates profitability, and executes flash-loan-backed arbitrage trades via a deployed Solidity contract.

---

## What It Does

- Monitors swap events on **Uniswap V3** and **PancakeSwap V3** in real time
- Detects price differences across token pairs
- Estimates profitability after gas costs
- Executes arbitrage via **Balancer flash loans** (no upfront capital required beyond gas)
- Live dashboard showing fork block, mainnet lag indicator, and trade log

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Smart Contract | Solidity |
| Development Framework | [Hardhat](https://hardhat.org/) |
| Blockchain Interaction | [Ethers.js](https://docs.ethers.io/v5/) |
| Node Provider | [Alchemy](https://www.alchemy.com/) |
| Flash Loans | [Balancer](https://balancer.fi/) |
| Exchange 1 | [Uniswap V3](https://docs.uniswap.org/contracts/v3/overview) |
| Exchange 2 | [PancakeSwap V3](https://docs.pancakeswap.finance/) |
| Frontend | React + Vite |

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dashboard connects to a locally running Hardhat node or a live RPC endpoint (configured via `.env`).

---

## Environment Variables

Create a `.env` file (see `.env.example`):

```
ALCHEMY_API_KEY=""
PRIVATE_KEY=""       # Account to receive profit / execute arbitrage contract
```

> Never use Hardhat's generated test keys in production.

---

## Fork Freshness Indicator

When running locally (`isLocal: true`), the dashboard shows:

- **Fork block** — the Hardhat snapshot block number
- **Behind blocks** — how far behind mainnet the local fork is
- **Refork warning** — appears when the fork is too stale for reliable price data

`evm_mine` advances the local chain's block/time but does not pull new mainnet swaps. To get fresher data, restart the node with a newer fork block.

---

## Configuration — `config.example.json`

Key fields under `PROJECT_SETTINGS`:

| Key | Purpose |
|-----|---------|
| `isLocal` | `true` = use Hardhat fork · `false` = monitor live mainnet |
| `isDeployed` | `true` = execute trades · `false` = monitor only |
| `ARBITRAGE_ADDRESS` | Deployed contract address |
| `PRICE_DIFFERENCE` | Minimum spread required to attempt a trade |

Token pair and exchange addresses are set under `TOKENS`, `UNISWAP`, and `PANCAKESWAP`.

---

## Supported Chains (Flash Loan Provider)

Balancer flash loans are available on: Ethereum, Arbitrum, Optimism, Polygon, Gnosis, Avalanche, Goerli, Sepolia.

---

## To Do

- Add support for more EVM chains
- Add support for more token pairs and pools
- Add support for additional Uniswap-style exchanges
- Add support for additional flash loan providers (beyond Balancer)
- Expand Solana / cross-chain support

---

*Built with [Hardhat](https://hardhat.org/) · [Balancer](https://balancer.fi/) · [Uniswap V3](https://docs.uniswap.org/contracts/v3/overview)*

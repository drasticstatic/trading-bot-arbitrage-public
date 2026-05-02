# Contributing

Thank you for your interest in the DAPPUv3 Arbitrage Bot — an on-chain DEX arbitrage system built with Hardhat targeting Arbitrum.

## Getting Started

```bash
git clone https://github.com/drasticstatic/trading-bot_arbitrage_DAPPUv3_hardhat_UNI-CAKE.git
cd trading-bot_arbitrage_DAPPUv3_hardhat_UNI-CAKE
npm install
npx hardhat compile
npx hardhat test
```

> ⚠️ **Never put real private keys in `config.json`** — use a `.env` file (gitignored) or Hardhat's `accounts` config with environment variables.

## How to Contribute

1. **Fork** the repository and create a branch (`git checkout -b feature/your-change`)
2. **Write tests** for any contract or bot logic changes
3. **Run the test suite**: `npx hardhat test`
4. **Open a Pull Request** with a clear description of what changed and why

## Smart Contract Guidelines

- Follow existing NatSpec patterns
- No external calls without reentrancy guards
- Flag any change touching fund flows, access control, or arbitrage execution logic in your PR description
- Test on Hardhat local fork before proposing changes that affect live execution

## Reporting Security Issues

**Do not report vulnerabilities in public Issues.** See [SECURITY.md](SECURITY.md) for responsible disclosure.

## Code Style

Match the existing patterns. One logical change per PR.

---

*Maintained by [drasticstatic](https://github.com/drasticstatic)*

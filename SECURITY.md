# Security Policy

## About This Project

An on-chain DEX arbitrage bot targeting Arbitrum, built with Hardhat. Interfaces with Uniswap V3 and PancakeSwap for live price discovery and execution. Handles real fund management and contract execution.

## Scope

Security research is welcomed for:

- **Smart contracts** — flash loan misuse, reentrancy, unauthorized withdrawal, fund drain vectors
- **Arbitrage path manipulation** — sandwich attack exposure, price oracle manipulation
- **Access control** — unauthorized contract ownership or fund access
- **Scripts** — private key or credential exposure in `config.json`, Hardhat config, or scripts
- **Frontend** — if applicable, wallet connection exploits or transaction spoofing

Out of scope: bugs in upstream dependencies (Uniswap, PancakeSwap, OpenZeppelin, Hardhat) — report those upstream.

## Reporting a Vulnerability

**Do not open a public Issue.** Use one of:

1. **GitHub Private Vulnerability Reporting** *(preferred)* — click **"Report a vulnerability"** on the Security tab
2. **Email** — contact via [GitHub profile](https://github.com/drasticstatic)

Please include:
- Affected contract or script
- Attack vector and steps to reproduce
- Proof of concept (Hardhat test or pseudocode)
- Estimated impact (funds at risk, severity)

**Response commitment:** Acknowledgement within 48 hours.

## Responsible Disclosure

Coordinated disclosure — 90 days before public publication. Researchers credited in the advisory.

## Safe Harbor

Good-faith research on **testnets** and **local Hardhat environments** is authorized. Unsolicited testing on mainnet/Arbitrum mainnet is not authorized.

## ⚠️ Config File Warning

`config.json` in this repo **must not contain real private keys**. If you discover a committed private key or seed phrase, report it immediately via the channels above — this is the highest-priority class of finding.

## Recognition

Confirmed vulnerability reporters will be:
- Credited in the published GitHub Security Advisory
- Listed in [CONTRIBUTORS.md](https://github.com/drasticstatic/drasticstatic/blob/main/CONTRIBUTORS.md)
- Offered a LinkedIn recommendation for high-severity findings

We do not currently offer monetary rewards.

---

*Maintained by [drasticstatic](https://github.com/drasticstatic)*

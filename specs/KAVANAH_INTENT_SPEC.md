# Kavanah Intent Spec — Repo Backup Snapshot

This is a concise git-tracked backup of the live Intent spec for this repo. The live
Intent spec and workspace notes remain the source of truth for planning, coordination,
and task status.

**Last synced:** 2026-03-29

## Goal

Close the post-stabilization coordination loop by archiving the verified older
VSCode-era claims and keeping repo-local backup visibility, without reopening backend
runtime work.

## Accepted completed waves

- Backend stabilization `b08ef38` restored screener/perp runtime delivery.
- Re-verification confirmed `npx hardhat test`, `npm run build`, and focused smoke
  checks passed for the accepted runtime/UI work.
- UI clarification `bc4a8d9` improved cold-start, partial perp warm-up,
  refork-needed, and expected-unavailable messaging.
- Older VSCode-era verification confirmed deployment-details centering/layout,
  activity-log spacing, footer centering/link spacing, mainnet wallet balance and
  RPC-label clarity, and fork diagnostics visibility/readability.

## Latest verified archive state

- Only one tiny concrete follow-up remains from this verification pass: make
  `Settings updated` feedback human-readable instead of showing internal keys such as
  `autoExecute`.
- Older generic perp/offline polish concerns and vague “more bento-like” wording are
  superseded, not active defects.
- Repo markdown remains secondary: active coordination stays in the live Intent spec
  and workspace notes.

## Deferred / not archived as done

- Wallet-connect decision work.
- Broader pair/universe expansion beyond current mapped coverage.
- Authenticated Hyperliquid execution while account/keys are unavailable.
- Separate flashloan/Aave-style strategy work.


# Intent Coordinator Summary

## To: Kavanah / next Intent coordinator

This folder is a private repo-local export of what the VSCode Augment chat established for the arbitrage bot repo as of 2026-03-08.

## What was exported

- a reading-order README
- a fast-start handoff for next actions
- architecture and operations notes for bot / contract / Hardhat / frontend / perp integration
- status, validation gaps, and known risks
- a file map with edit starting points
- a concise session-history summary with the latest debugging delta

## How to use it

1. Read this file.
2. Read `README.md` for bundle structure.
3. Read `FAST_START_HANDOFF.md` to pick up the next wave.
4. Use `ARCHITECTURE_AND_OPERATIONS.md` and `FILE_MAP_AND_EDIT_GUIDE.md` while planning work.
5. Use `STATUS_AND_RISKS.md` before deciding whether the next wave is build, debug, or validation focused.

## Most important current reality

- The repo already has the right architectural base for spot flashloan arbitrage.
- Perp monitoring was added successfully at the code level.
- The current blocker is not lack of features; it is stable end-to-end runtime delivery of screener/perp data to the frontend.
- Recent evidence points toward runtime instability around repeated local mining and/or lifecycle timing, not just a UI bug.

## Privacy limits

- No secrets were read or copied into this export.
- No `.env`, wallet, seed phrase, or keystore data was used.
- This bundle should remain inside this private repo only.

## Confidence limits

- Strong on code structure, recent changes, and likely edit targets.
- Moderate on final live UI state after the most recent restart because user-side browser confirmation had not yet been reported when the export was created.

## Recommended next coordinator move

Run the next wave as a focused debug/verify pass:

- instrument screener delivery if needed
- stabilize `evm_mine` / local fork behavior
- remove temporary debug logs after confirmation
- re-run `npx hardhat test` and `npm run build`

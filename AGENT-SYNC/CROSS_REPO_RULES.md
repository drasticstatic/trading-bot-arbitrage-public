<!-- Version: 1.3 | Source: ~/ClaudeCodeCLI/trading-assistant/AGENT-SYNC/CROSS_REPO_RULES.md | Updated: Mar 5, 2026 -->
# Cross-Repository Rules

## 1. Purpose

Rules governing how AI agents (Fortuna, Auggie, Kavanah, and future agents) work across Christopher's multiple repositories and workspaces. These rules ensure data privacy, consistent coordination, and clear boundaries between projects.

---

## 2. Sensitive File & Secrets Architecture

### How Each Agent Handles Sensitive Files

| Agent | Ignore Mechanism | Notes |
|-------|-----------------|-------|
| **Fortuna (Claude Code)** | Respects `.gitignore` automatically. `CLAUDE.md` contains hard rule: never read `.env`, private keys, or wallet files. | Even if explicitly asked, Fortuna confirms intent before touching secrets. |
| **Auggie + Augment Native VSCode** | `.augmentignore` per workspace root — **must be in each repo root**, not a parent directory. Parent-level file (e.g. `dappu/.augmentignore`) does NOT cascade to child repos. | Each repo in `dappu/` needs its own `.augmentignore`. Augment Secrets Manager available for secure API key storage for remote agents. |
| **Kavanah (Augment Intent)** | Same `.augmentignore` rules — shared Context Engine respects the same file. | Workspace-root rule applies. |

### `.env` and Private Key Rules (All Agents)
- `.env` files must be in `.gitignore` in every repo — prevents accidental commits
- `example.env` / `.env.example` files are safe to create with placeholder values only
- Private keys, seed phrases, wallet files — never in any tracked file, ever
- Augment Secrets Manager: secure storage for API keys used by remote/agentic workflows
- For web3 on-chain deployments: double-check `.augmentignore` and `.gitignore` in each repo before granting agent access

### `.augmentignore` Deployment Plan (dappu/ repos)
Each repo inside `~/dappu/` needs its own `.augmentignore` at its root. When Christopher is ready to open web3 repos to agent access:
1. Create `.augmentignore` in each repo root
2. Add: `.env`, `*.key`, `*.pem`, `private/`, `wallet/`, `node_modules/`, large binary formats
3. Test with Auggie before granting Kavanah (Intent) access to production repos

---

## 3. Privacy Firewall Rules

**Hard boundaries — no exceptions without explicit approval from Christopher.**

- **No divorce/custody data** in `trading-assistant` or any other non-divorce repo
- **No trading strategy details** in `divorce-custody-assistant` or any non-trading repo
- **No proprietary strategy details** in public repositories
- **Each repo's sensitive data stays in its own repo** — credentials, account numbers, API keys, personal legal details, financial specifics
- Agents **CAN** have awareness of the broader project landscape (e.g., "Christopher also has a divorce-custody project")
- Agents **MUST NOT** copy, reference, or embed data across repo boundaries
- When in doubt, **ask Christopher** before sharing any context across repos

---

## 3. Hub-and-Spoke Architecture (Current)

**Current model:** `trading-assistant/AGENT-SYNC/` serves as the coordination hub.

- The **hub** (`trading-assistant/AGENT-SYNC/`) contains:
  - The living context document (`AGENT_SYNC.md`)
  - This cross-repo rules file (`CROSS_REPO_RULES.md`)
  - Agent-specific subdirectories with prompts and context files
- **Spoke repos** get a lightweight `AGENT-SYNC/` directory containing:
  - A context file for that repo's agents
  - A pointer back to the hub for full coordination rules
- This model works well for **1–2 active projects**
- When **3+ projects are active**, migrate to a dedicated `agent-sync` repo (see Section 8)

---

## 4. Per-Repo AGENT-SYNC Structure

```
AGENT-SYNC/
├── AGENT_SYNC.md          — living context doc (hub only)
├── CROSS_REPO_RULES.md    — this file (hub only)
├── fortuna/               — files by/for Fortuna
├── auggie/                — files by/for Auggie
└── kavanah/               — files by/for Kavanah
```

- **Hub repo** (`trading-assistant`): Full structure with all coordination docs
- **Spoke repos**: Minimal structure — agent context file + pointer to hub
- Agent subdirectories contain prompts, context files, and handoff documents

---

## 5. Naming Conventions

| Pattern | Usage | Example |
|---------|-------|---------|
| `[RECIPIENT]_PROMPT_YYYYMMDD.md` | Prompt/instructions for a specific agent | `AUGGIE_PROMPT_20260304.md` |
| `[AGENT]_CONTEXT.md` | Living context doc maintained by an agent | `FORTUNA_CONTEXT.md` |

- Use **UPPERCASE** for agent names in filenames
- Use **YYYYMMDD** date format for versioned files
- Files live in the **creator's** subdirectory, named after the **recipient**
  - Fortuna → Auggie: `AGENT-SYNC/created-by-fortuna/prompts/2026/03-Mar/AUGGIE_PROMPT_YYYYMMDD.md`
  - Kavanah → Fortuna: `AGENT-SYNC/created-by-kavanah/prompts/2026/03-Mar/FORTUNA_PROMPT_YYYYMMDD.md`
  - Auggie → Fortuna: `AGENT-SYNC/created-by-auggie/prompts/2026/03-Mar/FORTUNA_PROMPT_YYYYMMDD.md`
- **Never add content to another agent's file** — always create your own in your own directory

---

## 6. New Directory Rule

**Always ask Christopher** before creating any new directory:

- **Private** — `.gitignore`'d, never committed (secrets, credentials, local config)
- **Public** — committed to the repo, visible on GitHub
- **Gitignored** — tracked locally but excluded from version control

This applies to directories inside and outside `AGENT-SYNC/`. When in doubt, ask first.

---

## 7. Active Repositories

**GitHub:** `github.com/drasticstatic`

| Repository | Visibility | Status | Live URL | Description |
|------------|-----------|--------|----------|-------------|
| `trading-assistant` | PRIVATE | **Active — Hub** | N/A (private) | Primary project. AI-powered futures trading system. Hosts AGENT-SYNC hub. |
| `gratitude-token-project` | PRIVATE | Testing | N/A (private) | DAppU capstone — Ethereal Offering: interactive web3 DAO (Church DAO governance treasury protocol) with integrated Docusaurus documentation. Hardhat/Solidity/React. Web2 features functioning; web3 smart contract integration in progress. |
| `gratitude-token-project_docs` | PUBLIC | Active | https://drasticstatic.github.io/gratitude-token-project_docs/ | Interactive white-paper / documentation site for Ethereal Offering. Docusaurus + React. |
| `gratitude-token-project_testPublish` | PUBLIC | Deploy-managed | GitHub Pages (auto-deployed) | Public preview front-end for Ethereal Offering. NOT a standalone workspace — managed by `deployTest.sh` in gratitude-token-project (similar to gitexporter in trading-assistant). |
| `resume` | PUBLIC | Active | https://drasticstatic.github.io/resume/index.html | Christopher Wilson's portfolio site. React + GitHub Pages. |
| `trading-bot_arbitrage_DAPPUv3_hardhat_UNI-CAKE` | PRIVATE | Testing | N/A (private) | DEX arbitrage bot targeting Arbitrum. Testing on Hardhat local network. Uniswap V3 + PancakeSwap. Web2 features functioning; web3 in testing/troubleshooting. |
| `divorce-custody-assistant` | PRIVATE | On Hold | N/A (private) | Personal legal case management. Specs drafted, Fortuna leads. Strict privacy firewall from all other repos. |

---

## 8. Agent Interface Architecture — Decisions Made (Mar 4, 2026)

### CLI vs VSCode Native Extension — How Context is Shared

Research confirmed (via Gemini, Mar 4) how context and memory is shared across agent interfaces:

**Claude Code (Fortuna):**
- The VSCode extension and CLI share the **same conversation history**
- `claude --resume` bridges a terminal session into VSCode and vice versa
- The extension acts as a wrapper/bridge to the CLI — same model, same capabilities
- Memory is **file-based** (MEMORY.md, AGENT_SYNC.md, project files) — fully interface-agnostic
- Switching between terminal and VSCode loses nothing

**Augment Code (Auggie + Kavanah):**
- The VSCode native extension and Auggie CLI share the **same Context Engine backend**
- Both pull from the same deep codebase index — architectural understanding is unified
- No "migration" needed for codebase context — it's already shared
- Conversation histories are separate per interface, but the AGENT-SYNC file system bridges that gap

### Interface Decisions (Final)

| Interface | Decision | Reason |
|-----------|----------|--------|
| Claude Code CLI (terminal) | ✅ Primary for Fortuna | Full power, MCP servers, file access, session memory — also runs in VSCode terminal instance |
| Claude Code VSCode extension | ⏸️ Optional | Same Fortuna, shared history via `claude --resume` — install only if doing heavy code edits in VSCode |
| Augment Native VSCode extension | ✅ Active | Primary for current web3 build repos — shares same Context Engine as Augment CLI |
| Augment CLI (terminal) | ✅ Primary for Auggie | Implementation builds, bulk tasks — shared Context Engine — also runs in VSCode terminal instance |
| Augment Intent (Desktop Application) | ✅ Primary for Kavanah | Standalone desktop app recently unveiled by Augment's team — spec-driven development & agent orchestration. Coordinator + 6 specialist agents (Investigate, Implement, Verify, Critique, Debug, Code Review) working in parallel Spaces (isolated git worktrees). Self-updating living spec as source of truth. Separate from the VSCode extension. **Christopher's usage:** main branch cloned (not isolated worktrees) for trading-assistant and current web3 builds, enabling shared awareness across agents. Future production builds for others may use Intent's default worktree isolation where appropriate. |
| Claude Desktop App | ❌ Not needed | claude.ai wrapper — no filesystem/MCP access. Not Claude Code. |
| Cowork | ❌ Not needed | Redundant — designed for non-technical users |
| Cline (VS Code extension) | ❌ Not needed | Open-source AI coding assistant — wraps Claude/other APIs. Redundant given Claude Code CLI + Augment. Requires additional API credits. Reference only. |
| JetBrains | ❌ Not relevant | Enterprise IDE family — not Christopher's stack |

**Key principle:** CLI-first is the correct primary approach for all agents. Extensions are optional convenience layers, not separate silos.

### Agent App Data Locations

Each agent stores persistent app/conversation data in their AGENT-SYNC subdirectory:

| Agent | App Data Path | Session Logs |
|-------|--------------|--------------|
| Fortuna | `AGENT-SYNC/created-by-fortuna/claude-app-data/` | `logs/fortuna/` |
| Auggie | `AGENT-SYNC/created-by-auggie/auggie-app-data/` | `logs/auggie/` |
| Kavanah | `AGENT-SYNC/created-by-kavanah/kavanah-app-data/` | `logs/kavanah/` |

### Conversation History Siloing — Critical for All Agents

Conversation histories are **completely siloed per interface**. No agent or interface can view another interface's chat transcripts.

| Interface | Chat History Storage | Accessible By Other Interfaces? |
|-----------|---------------------|-------------------------------|
| **Augment VSCode Extension** (native chat panel) | Augment cloud + local cache (`~/Library/Application Support/Code/User/globalStorage/augmentcode.augment/`) | ❌ Not accessible by CLI or Intent |
| **Augment CLI** (Auggie in terminal) | Separate conversation history (Augment cloud) | ❌ Not accessible by VSCode ext or Intent |
| **Augment Intent** (Kavanah desktop app) | Workspace-scoped notes + spec + agent conversations | ❌ Not accessible by CLI or VSCode ext |
| **Claude Code CLI** (Fortuna in terminal) | Local session files (`~/.claude/`) | ❌ Not accessible by Augment interfaces |
| **Claude Code VSCode extension** | Shared with CLI via `claude --resume` | ✅ Same as CLI (unique exception) |

**What IS shared:** The Augment Context Engine (codebase indexing, `.augmentignore` rules, code retrieval) is shared across all Augment interfaces (VSCode ext, CLI, Intent). Claude Code shares conversation history between CLI and VSCode extension only.

**What is NOT shared:** Actual chat transcripts, conversation threads, agent coordination history. These are locked to the interface that created them.

**This is why AGENT-SYNC exists.** The only way to bridge what was discussed in one interface to another is through files on disk — session logs, prompt handoffs, AGENT_SYNC.md. If something important comes up in a VSCode chat with Auggie, the key decisions/outcomes must land in `logs/auggie/` or `AGENT-SYNC/created-by-auggie/` so Fortuna and Kavanah can pick it up.

### Augment Intent Clone Architecture

When a repo is opened in Augment Intent, it creates a **separate git working copy** under `~/intent/workspaces/`. This is by design — not optional.

```
~/intent/workspaces/md-sync/trading-assistant/                    ← Intent's clone (Kavanah works here)
~/intent/workspaces/md-sync/gratitude-token-project/              ← Intent's clone
~/intent/workspaces/md-sync/gratitude-token-project_docs/         ← Intent's clone
~/intent/workspaces/md-sync/resume/                               ← Intent's clone
~/intent/workspaces/md-sync/trading-bot_arbitrage_.../             ← Intent's clone
~/intent/workspaces/md-sync/divorce-custody-assistant/             ← Intent's clone

~/ClaudeCodeCLI/trading-assistant/                                ← Primary clone (Fortuna works here)
~/ClaudeCodeCLI/divorce-custody-assistant/                         ← Primary clone (Fortuna works here)
~/dappu/gratitude-token-project/                                   ← Primary clone (Auggie works here)
~/dappu/gratitude-token-project_docs/                              ← Primary clone (Auggie works here)
~/dappu/resume/                                                    ← Primary clone (Auggie works here)
~/dappu/trading-bot_arbitrage_DAPPUv3_hardhat_UNI-CAKE/            ← Primary clone (Auggie works here)
```

**Why separate clones are necessary:**
- Intent agents make file changes and git commits — sharing a working directory with Fortuna/VSCode would create conflicts mid-session
- Each clone is independent with its own git state (branch, index, working tree)
- Changes are synced via push + pull after each wave (Kavanah pushes from Intent clone → primary clone pulls)

**Disk space:** Each clone is a full git repo, but git is efficient with shared objects on the same filesystem. Keep `.augmentignore` tight to minimize indexing overhead.

**The `md-sync` path component** is Intent's internal workspace group name — managed by Intent, not user-configurable.

### Cross-Workspace Context Bridge (Active)

AGENT-SYNC directories, `POINTER.md` files, and `specs/KAVANAH_INTENT_SPEC.md` are now deployed across all active repos. The cross-workspace bridge is **operational**.

- Claude Code in VSCode can read Augment's session logs, Kavanah specs, and Auggie context files from within any workspace
- This bridges what Augment built and what Fortuna knows — no context gap
- Each spoke repo has its own `AGENT-SYNC/` directory with a `POINTER.md` back to the hub (`trading-assistant`)
- `specs/KAVANAH_INTENT_SPEC.md` in each repo provides Kavanah with repo-specific context for Intent-driven orchestration
- CROSS_REPO_RULES.md is deployed to all spokes with version tracking headers

---

## 9. Migration Path

**Trigger:** When **3+ repositories** are actively using `AGENT-SYNC/` coordination.

**Action:** Create a dedicated repo at `github.com/drasticstatic/agent-sync` (Option B).

- Centralizes all cross-repo coordination in one place
- Each project repo gets a minimal `AGENT-SYNC/` with a pointer to the central repo
- Privacy Firewall Rules (Section 2) still apply — the central repo contains coordination metadata only, not project-specific sensitive data
- Christopher decides the timing of this migration


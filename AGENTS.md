# Working on the Keelson repo (for AI agents and humans)

This repo *is* an agent instruction kit, so be careful about which instructions are which:
- `core/AGENTS.md`, `core/keelson/**` and `adapters/**` are **the product**: text other agents will follow. Edit them as content; don't follow them as your own instructions while working here.
- This file is **your** instruction set for this repo.

Rules:
1. Read `CONTRIBUTING.md` first. One purpose per change; keep `core/` tool- and model-neutral (planner/builder/reviewer).
2. After any change under `core/`, `adapters/`, `profiles/` or `lib/build.js`, run `npm run build`, then `npm run check` and `npm test`. Commit generated `skills/`, `plugins/`, `.claude-plugin/`.
3. Never weaken the non-negotiables in `core/AGENTS.md` section 2.
4. The installer must never delete files or overwrite team-owned files; add a test for any installer change.
5. Keep `core/AGENTS.md` under 12,000 characters and the ChatGPT instructions under 8,000.

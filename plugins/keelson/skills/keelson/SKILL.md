---
name: keelson
description: Staff-level engineering workflow for coding agents: ask and teach, debug to root cause, plan with zero open questions, spec-driven development (planner writes executable specs, builder sub-agents implement), independent review, validated multi-agent orchestration, context handoff, and rules that improve from corrections. Use for any software engineering task in a repository (questions, bugs, features, PRDs/TRDs, reviews) or when the user mentions Keelson.
---

# Keelson

Read `references/persona.md` now and follow it for this whole session: it is the full Keelson instruction set (non-negotiables, modes, gates, orchestration, handoff, learning).

Path mapping for this skill install:
- `playbooks/…`, `roles/…`, `evals/…` and `templates.md` live under `references/` next to this file.
- Team memory lives in the project at `.keelson/memory/` and `docs/agent/`. If those files don't exist, create them from the templates only after the engineer approves.
- Stack profile: use `.keelson/profile.md` if the project has one; otherwise `references/profiles/generic.md` (auto-detect the stack from the repo).
- Model roles: `.keelson/models.yaml` if present, else `references/models.yaml`.

For the full install (hooks, pinned sub-agents, team memory), run `npx github:abhishek305/keelson init` in the repo.

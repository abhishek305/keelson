# Changelog

All notable changes to Keelson. Versioning follows [SemVer](https://semver.org/): a change to the installed file layout or to a template other files depend on is a **major** change.

## 0.1.0 (unreleased)

First public release.
- Persona, 13 playbooks, 12 roles, evals and templates as tool-neutral Markdown (`core/`).
- Model roles (planner / builder / reviewer) in `.keelson/models.yaml`; stack profiles `generic`, `node-fullstack`, `python-backend`.
- Spec-driven development with executable-spec slices and execution waves.
- Validated multi-agent orchestration, per-agent context budgets, relays, handoff at ~85% and automatic resume.
- Installer run straight from GitHub: `npx github:abhishek305/keelson init | update | doctor | chatgpt | profiles`; kit files vs team-owned files; `.keelson-new` for edited kit files.
- Adapters: Claude Code (sub-agents, guard/context/resume hooks, status line), OpenCode (sub-agents), Codex (skill), Cursor, Copilot, Gemini CLI, ChatGPT pack.
- Agent Skill (`skills/keelson`) and Claude Code plugin + marketplace.

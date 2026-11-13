# Codex adapter
- Codex reads `AGENTS.md` natively, so the Keelson block in `AGENTS.md` is the persona.
- The installer also copies the `keelson` skill to `.agents/skills/keelson/` (Agent Skills format).
- Sub-agents and hooks: Codex's formats for custom agents and hooks changed quickly through 2026, so v0.1 doesn't generate them. Run sub-agent roles in a fresh Codex session with only the inputs the role file allows (AGENTS.md section 6 describes this fallback). Contributions welcome: see CONTRIBUTING.md → "New tool adapter".

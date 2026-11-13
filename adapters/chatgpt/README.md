# ChatGPT pack

ChatGPT has no repo files, hooks or sub-agents, so Keelson runs there in a reduced form: Ask/Teach, Debug, Context, Plan, Spec-driven (planning only), Review and Learn.

`npx keelson chatgpt` (or `npm run build`) writes `dist/chatgpt/`:
- `instructions.md`: paste into a Custom GPT's or a Project's instructions (kept under 8,000 characters by CI).
- `keelson-playbooks.md`, `keelson-roles.md`, `keelson-templates.md`: upload as knowledge files.

Tips: enable web search so it can verify version-specific facts. Use a Project per codebase and upload your `context.md`, `team-rules.md` and handoffs there.

# Security

## What runs on your machine
Keelson is mostly Markdown, but the Claude Code adapter installs **shell hooks** (`.claude/hooks/*.sh`, `.claude/statusline.sh`) that run on every prompt or tool call. They read the hook's JSON input, write small counters under `$TMPDIR/keelson-ctx/`, and print messages; they make **no network calls**. Read them before enabling them. The installer never deletes files and never overwrites team-owned files.

Hooks match command text, so they're a speed bump, not a security boundary. Use GitHub branch protection, required reviews, secret scanning and your tool's sandbox for real enforcement.

## Prompt injection
The instructions tell agents to treat web pages, tickets, docs, logs and tool output as data, never as instructions. That lowers risk but can't remove it. Don't give one agent session private data, untrusted content *and* an outbound channel (Slack, email, push) without approving each outbound action.

## Reporting a vulnerability
Please use GitHub's **private vulnerability reporting** (Security → Report a vulnerability) rather than a public issue. Expect an acknowledgement within a week.

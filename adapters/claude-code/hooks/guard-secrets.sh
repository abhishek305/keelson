#!/usr/bin/env bash
# Blocks file writes that look like they contain secrets.
content=$(jq -r '.tool_input.content // .tool_input.new_string // ""')
if echo "$content" | grep -Eq '(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[0-9A-Za-z-]+|hooks\.slack\.com/services/|ghp_[0-9A-Za-z]{36}|sk-[A-Za-z0-9_-]{20,})'; then
  echo "BLOCKED: content looks like a secret. Use an env var or secret manager." >&2
  exit 2
fi
exit 0

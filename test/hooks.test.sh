#!/usr/bin/env bash
# Tests for the Claude Code hooks. Needs bash, jq and git.
set -u
H="$(cd "$(dirname "$0")/../adapters/claude-code" && pwd)"
export TMPDIR="$(mktemp -d)"
pass=0; fail=0
check() { # name, condition-result
  if [ "$2" = 0 ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: $1"; fi
}
ctx() { jq -r '.hookSpecificOutput.additionalContext // empty'; }

# guard-bash
echo '{"tool_input":{"command":"git push origin main"}}' | "$H/hooks/guard-bash.sh" 2>/dev/null; check "blocks push to main" $([ $? = 2 ]; echo $?)
echo '{"tool_input":{"command":"git commit --no-verify -m x"}}' | "$H/hooks/guard-bash.sh" 2>/dev/null; check "blocks --no-verify" $([ $? = 2 ]; echo $?)
echo '{"tool_input":{"command":"psql -c \"DROP TABLE users\""}}' | "$H/hooks/guard-bash.sh" 2>/dev/null; check "blocks DROP TABLE" $([ $? = 2 ]; echo $?)
echo '{"tool_input":{"command":"pnpm test"}}' | "$H/hooks/guard-bash.sh"; check "allows tests" $?

# guard-secrets
echo '{"tool_input":{"content":"key=AKIAABCDEFGHIJKLMNOP"}}' | "$H/hooks/guard-secrets.sh" 2>/dev/null; check "blocks AWS key" $([ $? = 2 ]; echo $?)
echo '{"tool_input":{"content":"const x = 1"}}' | "$H/hooks/guard-secrets.sh"; check "allows code" $?

# statusline + context-guard
echo '{"session_id":"s1","model":{"display_name":"M"},"context_window":{"used_percentage":62}}' | "$H/statusline.sh" >/dev/null
out=$(echo '{"session_id":"s1","hook_event_name":"UserPromptSubmit"}' | "$H/hooks/context-guard.sh"); check "silent at 62%" $([ -z "$out" ]; echo $?)
echo '{"session_id":"s1","model":{"display_name":"M"},"context_window":{"used_percentage":78}}' | "$H/statusline.sh" >/dev/null
out=$(echo '{"session_id":"s1","hook_event_name":"PostToolUse"}' | "$H/hooks/context-guard.sh" | ctx); check "warns at 78%" $(echo "$out" | grep -q 'CONTEXT AT 78%'; echo $?)
out=$(echo '{"session_id":"s1","hook_event_name":"PostToolUse"}' | "$H/hooks/context-guard.sh"); check "warns once" $([ -z "$out" ]; echo $?)
line=$(echo '{"session_id":"s1","model":{"display_name":"M"},"context_window":{"context_window_size":200000,"current_usage":{"input_tokens":1000,"cache_read_input_tokens":172000}}}' | "$H/statusline.sh")
check "statusline computes % from tokens" $(echo "$line" | grep -q 'HAND OFF'; echo $?)
out=$(echo '{"session_id":"s1","hook_event_name":"UserPromptSubmit"}' | "$H/hooks/context-guard.sh" | ctx); check "hand off at 86%" $(echo "$out" | grep -q 'Stop new work'; echo $?)

# agent-budget (sub-agents only)
out=$(echo '{"session_id":"s","tool_input":{}}' | "$H/hooks/agent-budget.sh"); check "ignores main agent" $([ -z "$out" ]; echo $?)
for i in $(seq 1 27); do echo '{"session_id":"s","agent_id":"a1","tool_input":{"q":"x"},"tool_response":"ok"}' | "$H/hooks/agent-budget.sh" >/dev/null; done
out=$(echo '{"session_id":"s","agent_id":"a1","tool_input":{"q":"x"},"tool_response":"ok"}' | "$H/hooks/agent-budget.sh" | ctx); check "sub-agent warn at 70% of calls" $(echo "$out" | grep -q 'finish the current item'; echo $?)
python3 -c "import json;print(json.dumps({'session_id':'s','agent_id':'a2','tool_input':{},'tool_response':'y'*700000}))" > "$TMPDIR/big.json"
out=$("$H/hooks/agent-budget.sh" < "$TMPDIR/big.json" | ctx); check "sub-agent relay on huge reads" $(echo "$out" | grep -q 'PARTIAL'; echo $?)

# session-start resume
R="$TMPDIR/repo with space"; mkdir -p "$R/docs/agent/export"; git -C "$R" init -q -b feat/export
cat > "$R/docs/agent/ACTIVE.md" <<'EOF'
| Task | Branch | Status | Handoff | Next action | Next step approved? | Updated |
|---|---|---|---|---|---|---|
| export-csv | feat/export | handed-off | `docs/agent/export/handoff.md` | implement AC4 | yes (G4) | 2026-10-30 |
| old | feat/old | done | `docs/agent/old/handoff.md` | - | - | 2026-10-01 |
EOF
printf '# Handoff\n## ▶ RESUME POINT (read this first)\n- **Next action:** implement AC4\n**Why handing off:** context\n' > "$R/docs/agent/export/handoff.md"
out=$(echo '{"source":"startup"}' | CLAUDE_PROJECT_DIR="$R" "$H/hooks/session-start.sh" | ctx)
check "resume injects resume point" $(echo "$out" | grep -q 'Next action:\*\* implement AC4'; echo $?)
check "size-check reminder on startup" $(echo "$out" | grep -q 'SIZE CHECK'; echo $?)
out=$(echo '{"source":"compact"}' | CLAUDE_PROJECT_DIR="$R" "$H/hooks/session-start.sh" | ctx)
check "compact says reload" $(echo "$out" | grep -q 'just compacted'; echo $?)
git -C "$R" checkout -q -b main
out=$(echo '{"source":"startup"}' | CLAUDE_PROJECT_DIR="$R" "$H/hooks/session-start.sh" | ctx)
check "other branch only listed" $(echo "$out" | grep -q 'other branches' && ! echo "$out" | grep -q 'old (branch'; echo $?)

echo "hooks: $pass passed, $fail failed"
[ "$fail" = 0 ]

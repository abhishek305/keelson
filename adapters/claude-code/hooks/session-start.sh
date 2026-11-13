#!/usr/bin/env bash
# SessionStart: injects the resume point of unfinished work for the current branch, so a new
# (or compacted / cleared) session picks up immediately. Reads docs/agent/ACTIVE.md.
# On every non-compact start it also adds the spec-driven size-check reminder (playbooks/spec-driven.md).
input=$(cat)
src=$(echo "$input" | jq -r '.source // "startup"')
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
reg="docs/agent/ACTIVE.md"
branch=$(git branch --show-current 2>/dev/null)

# Rows: | Task | Branch | Status | Handoff | Next action | Approved? | Updated |
rows=""
[ -f "$reg" ] && rows=$(grep -E '^\|' "$reg" | grep -viE '^\|[[:space:]]*Task[[:space:]]*\||^\|[-[:space:]|]+\|$' \
       | grep -iE '\|[[:space:]]*(handed-off|active|resumed[^|]*)[[:space:]]*\|')

field() { echo "$1" | awk -F'|' -v n="$2" '{gsub(/^[ \t`]+|[ \t`]+$/, "", $(n+1)); print $(n+1)}'; }
mine=""; others=""
[ -n "$rows" ] && while IFS= read -r r; do
  [ "$(field "$r" 2)" = "$branch" ] && mine+="$r"$'\n' || others+="- $(field "$r" 1) (branch $(field "$r" 2))"$'\n'
done <<< "$rows"

msg=""
[ -n "$rows" ] && [ "$src" = "compact" ] && msg+="The conversation was just compacted. Reload the resume point below and continue from it; do not rely on the summary for details."$'\n\n'
if [ -n "$mine" ]; then
  count=$(printf '%s' "$mine" | grep -c '^|')
  if [ "$count" -gt 1 ]; then
    msg+="Several unfinished tasks on branch '$branch'. Ask the engineer which one to resume:"$'\n'"$mine"
  else
    task=$(field "$mine" 1); handoff=$(field "$mine" 4); approved=$(field "$mine" 6)
    msg+="UNFINISHED WORK: '$task' on branch '$branch'. Resume it now per .keelson/playbooks/handoff.md → Resume (verify expected state, announce in ≤3 lines, continue). Next step approved: $approved. Handoff: $handoff"$'\n'
    if [ -f "$handoff" ]; then
      rp=$(awk '/^## ▶ RESUME POINT/{f=1;print;next} f&&/^(## |\*\*Why handing off)/{exit} f' "$handoff")
      [ -n "$rp" ] && msg+=$'\n'"$rp"
    else
      msg+="(Handoff file not found at that path. Tell the engineer.)"
    fi
  fi
elif [ -n "$others" ]; then
  msg+="Unfinished work exists on other branches (no action unless the engineer asks):"$'\n'"$others"
fi
if [ "$src" != "compact" ]; then
  [ -n "$msg" ] && msg+=$'\n'
  msg+="SIZE CHECK (Keelson): if the engineer's first task is a feature, epic, PRD or a bug needing 2+ slices, offer spec-driven development before coding, in one short question: the planner model writes an executable spec, the engineer approves it, implementer sub-agents on the builder model build the slices (models in .keelson/models.yaml). See .keelson/playbooks/spec-driven.md. Ask once per task; skip for small tasks, questions and reviews."
fi
[ -z "$msg" ] && exit 0
jq -n --arg m "$msg" '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $m}}'

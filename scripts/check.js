#!/usr/bin/env node
'use strict';
// Repo checks that keep the instructions portable and internally consistent.
const fs = require('node:fs');
const path = require('node:path');
const { listFiles, readText } = require('../lib/util');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const fail = (m) => errors.push(m);
const rel = (p) => path.relative(ROOT, p);

const mdFiles = (dir) => listFiles(path.join(ROOT, dir)).filter((f) => f.endsWith('.md')).map((f) => path.join(ROOT, dir, f));
const coreMd = [path.join(ROOT, 'core', 'AGENTS.md'), ...mdFiles('core/keelson'), ...mdFiles('core/seed')];
const adapterText = listFiles(path.join(ROOT, 'adapters')).map((f) => path.join(ROOT, 'adapters', f));

// 1. Core stays tool- and model-neutral: model names belong in models.yaml only.
const MODEL_NAMES = /\b(Opus|Sonnet|Haiku|Fable|Mythos|GPT-\d|o\d-mini|Gemini \d)(\s?\d[\d.]*)?\b/;
for (const f of [...coreMd, ...adapterText.filter((f) => !f.endsWith('.json'))]) {
  readText(f).split('\n').forEach((line, i) => {
    if (MODEL_NAMES.test(line)) fail(`${rel(f)}:${i + 1}: model name in portable text ("${line.match(MODEL_NAMES)[0]}"). Use planner/builder/reviewer and models.yaml.`);
  });
}

// 2. Every referenced Keelson file exists.
const exists = (p) => {
  if (p.startsWith('.keelson/memory/') || p.startsWith('docs/agent/')) {
    const seed = path.join(ROOT, 'core', 'seed', p);
    const isTemplateOnly = /<|local\/(my-rules|learner)\.md$/.test(p);
    return isTemplateOnly || fs.existsSync(seed) || /handoff|run-log|plan\.md|spec\.md|agents\//.test(p);
  }
  if (p === '.keelson/profile.md' || p === '.keelson/models.yaml' || p === '.keelson/manifest.json') return true;
  return fs.existsSync(path.join(ROOT, 'core', 'keelson', p.replace(/^\.keelson\//, '')));
};
const REF = /`?(\.keelson\/[\w./-]+\.(?:md|yaml))`?/g;
const BARE = /`((?:playbooks|roles|evals)\/[\w-]+\.md)`/g;
for (const f of [...coreMd, ...adapterText]) {
  const text = readText(f);
  for (const m of text.matchAll(REF)) if (!exists(m[1])) fail(`${rel(f)}: references missing file ${m[1]}`);
  for (const m of text.matchAll(BARE)) if (!fs.existsSync(path.join(ROOT, 'core', 'keelson', m[1]))) fail(`${rel(f)}: references missing file ${m[1]}`);
  if (!f.startsWith(path.join(ROOT, 'core'))) continue;
  for (const m of text.matchAll(/`([\w-]+\.md)`/g)) {
    const name = m[1];
    if (['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'README.md', 'SKILL.md', 'CONTRIBUTING.md', 'handoff.md', 'run-log.md', 'plan.md', 'spec.md', 'context.md', 'ideas.md', 'tools.md', 'lessons.md', 'team-rules.md', 'my-rules.md', 'learner.md', 'ACTIVE.md', 'templates.md', 'profile.md'].includes(name)) continue;
    const found = ['playbooks', 'roles', 'evals'].some((d) => fs.existsSync(path.join(ROOT, 'core', 'keelson', d, name)));
    if (!found) fail(`${rel(f)}: mentions \`${name}\` but no playbook/role/eval has that name`);
  }
}

// 3. Size budgets.
const persona = readText(path.join(ROOT, 'core', 'AGENTS.md'));
if (persona.length > 12000) fail(`core/AGENTS.md is ${persona.length} chars; keep the always-loaded persona under 12,000 (move detail into playbooks).`);
const gpt = readText(path.join(ROOT, 'adapters', 'chatgpt', 'instructions.md'));
if (gpt.length > 8000) fail(`adapters/chatgpt/instructions.md is ${gpt.length} chars; ChatGPT allows 8,000.`);

// 4. Agent templates and generated skill are well-formed.
for (const f of listFiles(path.join(ROOT, 'adapters', '_agents'))) {
  const t = readText(path.join(ROOT, 'adapters', '_agents', f));
  const name = (t.match(/^name: (.+)$/m) || [])[1];
  if (name !== f.replace(/\.md$/, '')) fail(`adapters/_agents/${f}: name "${name}" must match the file name`);
  if (!/^description: .{20,}$/m.test(t)) fail(`adapters/_agents/${f}: needs a description`);
  const role = path.join(ROOT, 'core', 'keelson', 'roles', f);
  if (!fs.existsSync(role)) fail(`adapters/_agents/${f}: no matching core/keelson/roles/${f}`);
}
const skillPath = path.join(ROOT, 'skills', 'keelson', 'SKILL.md');
if (fs.existsSync(skillPath)) {
  const s = readText(skillPath);
  const desc = (s.match(/^description: (.+)$/m) || [])[1] || '';
  if (!/^name: keelson$/m.test(s)) fail('skills/keelson/SKILL.md: name must be "keelson"');
  if (desc.length > 1024) fail(`skills/keelson/SKILL.md: description is ${desc.length} chars (max 1024)`);
} else fail('skills/keelson/SKILL.md missing: run `npm run build`');

// 5. JSON parses; shell scripts have a shebang.
for (const f of listFiles(ROOT).filter((f) => f.endsWith('.json') && !f.startsWith('node_modules') && !f.startsWith('.git/'))) {
  try {
    JSON.parse(readText(path.join(ROOT, f)));
  } catch (e) {
    fail(`${f}: invalid JSON (${e.message})`);
  }
}
for (const f of listFiles(path.join(ROOT, 'adapters')).filter((f) => f.endsWith('.sh'))) {
  if (!readText(path.join(ROOT, 'adapters', f)).startsWith('#!/usr/bin/env bash')) fail(`adapters/${f}: missing bash shebang`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('✓ checks passed');

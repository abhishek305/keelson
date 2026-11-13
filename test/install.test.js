'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { install, doctor } = require('../lib/install');
const { upsertBlock, parseYaml } = require('../lib/util');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'keelson test '));
const read = (d, f) => fs.readFileSync(path.join(d, f), 'utf8');
const exists = (d, f) => fs.existsSync(path.join(d, f));
const ALL = ['claude-code', 'codex', 'opencode', 'cursor', 'copilot', 'gemini'];

test('fresh install writes core, seeds, persona and every adapter', () => {
  const d = tmp();
  install(d, { tools: ALL, profile: 'node-fullstack' });
  for (const f of [
    '.keelson/playbooks/spec-driven.md', '.keelson/roles/_context-protocol.md', '.keelson/templates.md',
    '.keelson/models.yaml', '.keelson/profile.md', '.keelson/memory/team-rules.md', '.keelson/memory/local/my-rules.example.md',
    'docs/agent/ACTIVE.md', 'AGENTS.md', 'CLAUDE.md', '.claude/agents/implementer.md', '.claude/hooks/session-start.sh',
    '.claude/statusline.sh', '.claude/settings.json', '.opencode/agents/validator.md', 'opencode.json',
    '.agents/skills/keelson/SKILL.md', '.cursor/rules/keelson.mdc', '.github/copilot-instructions.md', 'GEMINI.md', '.gitignore',
  ]) assert.ok(exists(d, f), `missing ${f}`);
  assert.match(read(d, 'AGENTS.md'), /keelson:start[\s\S]*You are \*\*Keelson\*\*/);
  assert.match(read(d, '.keelson/profile.md'), /Node\.js full-stack/);
  assert.match(read(d, '.claude/agents/implementer.md'), /^model: sonnet$/m);
  assert.match(read(d, '.claude/agents/validator.md'), /^model: opus$/m);
  assert.doesNotMatch(read(d, '.opencode/agents/implementer.md'), /^model:/m, 'opencode inherits by default');
  assert.match(read(d, '.opencode/agents/implementer.md'), /^mode: subagent$/m);
  assert.ok(fs.statSync(path.join(d, '.claude/hooks/guard-bash.sh')).mode & 0o100, 'hooks executable');
  const settings = JSON.parse(read(d, '.claude/settings.json'));
  assert.ok(settings.hooks.SessionStart && settings.statusLine);
  assert.match(read(d, '.gitignore'), /\.keelson\/memory\/local\/\*/);
  assert.equal(doctor(d).issues.filter((i) => !/jq/.test(i)).length, 0);
});

test('re-running is idempotent', () => {
  const d = tmp();
  install(d, { tools: ALL, profile: 'generic' });
  const again = install(d, {});
  const writes = again.actions.filter((a) => a.op !== 'warn' && a.path !== '.keelson/manifest.json');
  assert.deepEqual(writes, [], JSON.stringify(writes));
  assert.deepEqual(again.tools, ALL, 'update remembers the tools');
  assert.equal((read(d, 'AGENTS.md').match(/keelson:start/g) || []).length, 1);
  const s = JSON.parse(read(d, '.claude/settings.json'));
  assert.equal(s.hooks.SessionStart.length, 1, 'no duplicate hooks');
});

test('existing user content is preserved', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'AGENTS.md'), '# My project\nUse pnpm.\n');
  fs.mkdirSync(path.join(d, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(d, '.claude/settings.json'), JSON.stringify({ model: 'x', hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo hi' }] }] }, statusLine: { type: 'command', command: 'mine.sh' } }));
  fs.writeFileSync(path.join(d, '.gitignore'), 'node_modules\n');
  const res = install(d, { tools: ['claude-code'], profile: 'generic' });
  assert.match(read(d, 'AGENTS.md'), /^# My project\nUse pnpm\.\n\n<!-- keelson:start/);
  const s = JSON.parse(read(d, '.claude/settings.json'));
  assert.equal(s.model, 'x');
  assert.equal(s.hooks.Stop[0].hooks[0].command, 'echo hi');
  assert.equal(s.statusLine.command, 'mine.sh', 'never replaces a custom status line');
  assert.ok(res.actions.some((a) => a.op === 'warn' && /statusLine/.test(a.note)));
  assert.match(read(d, '.gitignore'), /^node_modules\n/);
});

test('team memory is never overwritten; edited kit files are kept', () => {
  const d = tmp();
  install(d, { tools: ['claude-code'], profile: 'generic' });
  fs.writeFileSync(path.join(d, '.keelson/memory/team-rules.md'), 'OUR RULES');
  fs.writeFileSync(path.join(d, 'docs/agent/ACTIVE.md'), 'OUR REGISTRY');
  fs.writeFileSync(path.join(d, '.keelson/models.yaml'), 'roles:\n  builder:\n    claude-code: haiku\n');
  fs.appendFileSync(path.join(d, '.keelson/playbooks/debug.md'), '\nTEAM TWEAK\n');
  // simulate a new kit version changing debug.md
  const manifest = JSON.parse(read(d, '.keelson/manifest.json'));
  manifest.files['.keelson/playbooks/debug.md'] = 'stalehash';
  fs.writeFileSync(path.join(d, '.keelson/manifest.json'), JSON.stringify(manifest));
  const res = install(d, {});
  assert.equal(read(d, '.keelson/memory/team-rules.md'), 'OUR RULES');
  assert.equal(read(d, 'docs/agent/ACTIVE.md'), 'OUR REGISTRY');
  assert.match(read(d, '.keelson/playbooks/debug.md'), /TEAM TWEAK/);
  assert.ok(exists(d, '.keelson/playbooks/debug.md.keelson-new'));
  assert.ok(res.actions.some((a) => a.op === 'warn' && /debug\.md/.test(a.note)));
  assert.match(read(d, '.claude/agents/implementer.md'), /^model: haiku$/m, 'agents follow the team models.yaml');
  assert.ok(doctor(d).issues.some((i) => /Unmerged update/.test(i)));
});

test('dry run writes nothing', () => {
  const d = tmp();
  const res = install(d, { tools: ALL, profile: 'generic', dryRun: true });
  assert.ok(res.actions.length > 50);
  assert.deepEqual(fs.readdirSync(d), []);
});

test('bad tool or profile is rejected', () => {
  assert.throws(() => install(tmp(), { tools: ['vim'] }), /Unknown tool/);
  assert.throws(() => install(tmp(), { tools: ['codex'], profile: 'cobol' }), /Unknown profile/);
});

test('CLI runs end to end', () => {
  const d = tmp();
  const bin = path.join(__dirname, '..', 'bin', 'keelson.js');
  const out = execFileSync(process.execPath, [bin, 'init', '--yes', '--tools', 'codex,cursor', '--profile', 'python-backend', '--dir', d], { encoding: 'utf8' });
  assert.match(out, /Tools: codex, cursor/);
  assert.ok(exists(d, '.agents/skills/keelson/references/playbooks/spec-driven.md'));
  assert.ok(!exists(d, '.claude'), 'only selected tools');
  const gpt = path.join(d, 'gpt');
  execFileSync(process.execPath, [bin, 'chatgpt', '--out', gpt]);
  assert.ok(fs.readFileSync(path.join(gpt, 'instructions.md'), 'utf8').length < 8000);
});

test('helpers', () => {
  assert.equal(upsertBlock(upsertBlock('a', 'x'), 'y').match(/keelson:start/g).length, 1);
  assert.match(upsertBlock(upsertBlock('a', 'x'), 'y'), /\ny\n/);
  const y = parseYaml('roles:\n  planner:   # c\n    claude-code: opus\nagents:\n  v: { role: reviewer, effort: high }\n');
  assert.equal(y.roles.planner['claude-code'], 'opus');
  assert.equal(y.agents.v.effort, 'high');
});

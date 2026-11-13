'use strict';
const path = require('node:path');
const { VERSION, sha, readText, upsertBlock, Writer, PKG_ROOT } = require('./util');
const B = require('./build');

const TOOLS = ['claude-code', 'codex', 'opencode', 'cursor', 'copilot', 'gemini'];
const MANIFEST = '.keelson/manifest.json';

function detectTools(w) {
  const found = [];
  if (w.exists('.claude') || w.exists('CLAUDE.md')) found.push('claude-code');
  if (w.exists('.codex') || w.exists('.agents')) found.push('codex');
  if (w.exists('.opencode') || w.exists('opencode.json')) found.push('opencode');
  if (w.exists('.cursor')) found.push('cursor');
  if (w.exists('.github/copilot-instructions.md')) found.push('copilot');
  if (w.exists('GEMINI.md') || w.exists('.gemini')) found.push('gemini');
  return found;
}

/** Write a kit-owned file. If the user edited it since we last wrote it, keep theirs and write `<file>.keelson-new`. */
function writeManaged(w, manifest, rel, content, opts = {}) {
  const prevHash = manifest.files[rel];
  const current = w.read(rel);
  if (current !== null && prevHash && sha(current) !== prevHash && current !== content) {
    w.write(`${rel}.keelson-new`, content, { note: 'you edited this file; new version saved alongside' });
    w.warn(`Kept your edits in ${rel}; the new version is in ${rel}.keelson-new. Merge by hand, then delete it.`);
    return;
  }
  if (current !== null && !prevHash && current !== content) {
    w.write(`${rel}.keelson-new`, content, { note: 'file existed before keelson; new version saved alongside' });
    w.warn(`${rel} already existed and isn't Keelson's; Keelson's version is in ${rel}.keelson-new.`);
    return;
  }
  w.write(rel, content, opts);
  manifest.files[rel] = sha(content);
}

function mergeClaudeSettings(w, adapterSettings) {
  let settings = {};
  const raw = w.read('.claude/settings.json');
  if (raw) {
    try {
      settings = JSON.parse(raw);
    } catch {
      w.warn('.claude/settings.json is not valid JSON; skipped merging Keelson hooks. Fix it and run `npx github:abhishek305/keelson update`.');
      return;
    }
  }
  settings.permissions = settings.permissions || {};
  for (const key of ['deny', 'ask']) {
    const have = new Set(settings.permissions[key] || []);
    for (const rule of adapterSettings.permissions[key] || []) have.add(rule);
    settings.permissions[key] = [...have];
  }
  settings.hooks = settings.hooks || {};
  for (const [event, groups] of Object.entries(adapterSettings.hooks)) {
    settings.hooks[event] = settings.hooks[event] || [];
    const existing = new Set(settings.hooks[event].flatMap((g) => (g.hooks || []).map((h) => h.command)));
    for (const g of groups) {
      const cmds = g.hooks.map((h) => h.command);
      if (cmds.every((c) => existing.has(c))) continue;
      settings.hooks[event].push(g);
    }
  }
  if (!settings.statusLine) settings.statusLine = adapterSettings.statusLine;
  else if (!JSON.stringify(settings.statusLine).includes('keelson') && !JSON.stringify(settings.statusLine).includes('.claude/statusline.sh'))
    w.warn('You already have a Claude Code statusLine. Merge .claude/statusline.sh into it so the 85% context handoff can see usage.');
  w.write('.claude/settings.json', JSON.stringify(settings, null, 2) + '\n');
}

function mergeOpencodeConfig(w, base) {
  let cfg = { $schema: base.$schema };
  const raw = w.read('opencode.json');
  if (raw) {
    try {
      cfg = JSON.parse(raw);
    } catch {
      w.warn('opencode.json has comments or isn\'t plain JSON; add these to its "instructions": ' + base.instructions.join(', '));
      return;
    }
  }
  const have = new Set(cfg.instructions || []);
  for (const i of base.instructions) have.add(i);
  cfg.instructions = [...have];
  w.write('opencode.json', JSON.stringify(cfg, null, 2) + '\n');
}

function install(root, { tools, profile, dryRun = false, log = console.log } = {}) {
  const w = new Writer(root, { dryRun, log });
  const prev = w.read(MANIFEST);
  const manifest = prev ? JSON.parse(prev) : { files: {} };
  manifest.files = manifest.files || {};
  tools = tools && tools.length ? tools : manifest.tools && manifest.tools.length ? manifest.tools : detectTools(w);
  if (!tools.length) tools = ['claude-code', 'codex', 'opencode', 'cursor'];
  const bad = tools.filter((t) => !TOOLS.includes(t));
  if (bad.length) throw new Error(`Unknown tool(s): ${bad.join(', ')}. Choose from: ${TOOLS.join(', ')}`);
  profile = profile || manifest.profile || 'generic';
  if (!B.profiles().includes(profile)) throw new Error(`Unknown profile "${profile}". Choose from: ${B.profiles().join(', ')}`);

  // 1. Core (kit-owned) and seeds (team-owned)
  for (const f of B.coreFiles()) writeManaged(w, manifest, f.rel, f.content);
  for (const f of B.seedFiles()) w.seed(f.rel, f.content);
  if (!w.exists('.keelson/profile.md') || (profile !== manifest.profile && manifest.profile)) {
    if (w.exists('.keelson/profile.md') && profile !== manifest.profile) {
      w.write('.keelson/profile.md.keelson-new', B.profileText(profile));
      w.warn(`Profile changed to ${profile}; it's in .keelson/profile.md.keelson-new so your edits to profile.md aren't lost.`);
    } else w.write('.keelson/profile.md', B.profileText(profile));
  }

  // 2. Persona in AGENTS.md (read natively by Codex, Cursor, OpenCode, Copilot, Amp, and more)
  w.write('AGENTS.md', upsertBlock(w.read('AGENTS.md'), B.personaText()));

  // 3. Per-tool adapters
  const modelsText = w.read('.keelson/models.yaml');
  const models = B.loadModels(modelsText || undefined);
  const A = path.join(PKG_ROOT, 'adapters');
  if (tools.includes('claude-code')) {
    w.write('CLAUDE.md', upsertBlock(w.read('CLAUDE.md'), readText(path.join(A, 'claude-code', 'CLAUDE.md'))));
    for (const t of B.agentTemplates()) writeManaged(w, manifest, `.claude/agents/${t.name}.md`, B.renderClaudeAgent(t, models));
    for (const f of ['guard-bash.sh', 'guard-secrets.sh', 'context-guard.sh', 'agent-budget.sh', 'session-start.sh'])
      writeManaged(w, manifest, `.claude/hooks/${f}`, readText(path.join(A, 'claude-code', 'hooks', f)), { mode: 0o755 });
    writeManaged(w, manifest, '.claude/statusline.sh', readText(path.join(A, 'claude-code', 'statusline.sh')), { mode: 0o755 });
    mergeClaudeSettings(w, JSON.parse(readText(path.join(A, 'claude-code', 'settings.json'))));
  }
  if (tools.includes('opencode')) {
    for (const t of B.agentTemplates()) writeManaged(w, manifest, `.opencode/agents/${t.name}.md`, B.renderOpencodeAgent(t, models));
    mergeOpencodeConfig(w, JSON.parse(readText(path.join(A, 'opencode', 'opencode.base.json'))));
  }
  if (tools.includes('codex')) {
    for (const f of B.skillFiles()) writeManaged(w, manifest, `.agents/skills/keelson/${f.rel}`, f.content);
  }
  if (tools.includes('cursor')) {
    writeManaged(w, manifest, '.cursor/rules/keelson.mdc', readText(path.join(A, 'cursor', 'keelson.mdc')));
  }
  if (tools.includes('copilot')) {
    w.write('.github/copilot-instructions.md', upsertBlock(w.read('.github/copilot-instructions.md'), readText(path.join(A, 'copilot', 'copilot-instructions.md'))));
  }
  if (tools.includes('gemini')) {
    w.write('GEMINI.md', upsertBlock(w.read('GEMINI.md'), readText(path.join(A, 'gemini', 'GEMINI.md'))));
  }

  // 4. Keep personal memory out of git
  w.write(
    '.gitignore',
    upsertBlock(w.read('.gitignore'), '.keelson/memory/local/*\n!.keelson/memory/local/*.example.md\n*.keelson-new', 'hash'),
  );

  const changed = w.actions.some((a) => a.op !== 'warn');
  const sameSetup = manifest.version === VERSION && String(manifest.tools) === String(tools) && manifest.profile === profile;
  if (changed || !sameSetup || !prev) {
    manifest.version = VERSION;
    manifest.tools = tools;
    manifest.profile = profile;
    manifest.updated = new Date().toISOString();
    w.write(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  }
  return { actions: w.actions, tools, profile };
}

function doctor(root) {
  const w = new Writer(root, { dryRun: true });
  const issues = [];
  const ok = [];
  const m = w.read(MANIFEST);
  if (!m) return { ok, issues: ['Keelson is not installed here (no .keelson/manifest.json). Run `npx github:abhishek305/keelson init`.'] };
  const manifest = JSON.parse(m);
  ok.push(`Keelson ${manifest.version} installed for: ${manifest.tools.join(', ')} (profile: ${manifest.profile})`);
  if (manifest.version !== VERSION) issues.push(`Installed ${manifest.version}, this CLI is ${VERSION}. Run \`npx github:abhishek305/keelson update\`.`);
  for (const rel of Object.keys(manifest.files)) if (!w.exists(rel)) issues.push(`Missing ${rel}. Run \`npx github:abhishek305/keelson update\`.`);
  const agents = w.read('AGENTS.md') || '';
  if (!agents.includes('keelson:start')) issues.push('AGENTS.md has no Keelson block. Run `npx github:abhishek305/keelson update`.');
  for (const f of ['.keelson/memory/team-rules.md', 'docs/agent/ACTIVE.md', '.keelson/profile.md'])
    if (!w.exists(f)) issues.push(`Missing ${f} (team file). Run \`npx github:abhishek305/keelson update\` to recreate it.`);
  if (!w.exists('.keelson/memory/local/my-rules.md'))
    ok.push('Tip: copy .keelson/memory/local/my-rules.example.md to my-rules.md (and learner.example.md to learner.md) for personal rules.');
  if (manifest.tools.includes('claude-code')) {
    const { execSync } = require('node:child_process');
    try {
      execSync('command -v jq', { stdio: 'ignore' });
      ok.push('jq found (needed by the Claude Code hooks).');
    } catch {
      issues.push('jq not found: the Claude Code hooks need it (e.g. `brew install jq` or `apt install jq`).');
    }
    const fs = require('node:fs');
    for (const rel of Object.keys(manifest.files).filter((f) => f.endsWith('.sh'))) {
      try {
        fs.accessSync(w.abs(rel), fs.constants.X_OK);
      } catch {
        if (w.exists(rel)) issues.push(`${rel} is not executable: chmod +x ${rel}`);
      }
    }
  }
  const leftovers = Object.keys(manifest.files).map((f) => `${f}.keelson-new`).filter((f) => w.exists(f));
  for (const f of leftovers) issues.push(`Unmerged update: ${f}`);
  return { ok, issues };
}

module.exports = { TOOLS, install, doctor, detectTools };

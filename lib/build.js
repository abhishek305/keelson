'use strict';
// Builds generated artifacts from core/: the Agent Skill, per-tool agent files, the Claude plugin, the ChatGPT pack.
const path = require('node:path');
const { PKG_ROOT, VERSION, readText, listFiles, parseYaml } = require('./util');

const CORE = path.join(PKG_ROOT, 'core');
const ADAPTERS = path.join(PKG_ROOT, 'adapters');
const PROFILES = path.join(PKG_ROOT, 'profiles');

const REPO = 'abhishek305/keelson';

function coreFiles() {
  // Kit-owned files installed under .keelson/ (managed; updated by `keelson update`).
  const dir = path.join(CORE, 'keelson');
  return listFiles(dir)
    .filter((f) => f !== 'models.yaml')
    .map((f) => ({ rel: `.keelson/${f}`, content: readText(path.join(dir, f)) }));
}

function seedFiles() {
  // Team-owned files: created once, never overwritten.
  const dir = path.join(CORE, 'seed');
  const files = listFiles(dir).map((f) => ({ rel: f, content: readText(path.join(dir, f)) }));
  files.push({ rel: '.keelson/models.yaml', content: readText(path.join(CORE, 'keelson', 'models.yaml')) });
  return files;
}

function profiles() {
  return listFiles(PROFILES).map((f) => f.replace(/\.md$/, ''));
}
function profileText(name) {
  return readText(path.join(PROFILES, `${name}.md`));
}

function personaText() {
  return readText(path.join(CORE, 'AGENTS.md'));
}

function loadModels(text) {
  return parseYaml(text || readText(path.join(CORE, 'keelson', 'models.yaml')));
}

/** Agent templates: { name, description, tools, body } parsed from adapters/_agents/*.md */
function agentTemplates() {
  const dir = path.join(ADAPTERS, '_agents');
  return listFiles(dir).map((f) => {
    const raw = readText(path.join(dir, f));
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const fm = {};
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    return { name: fm.name, description: fm.description, tools: fm.tools, body: m[2].trim() };
  });
}

function modelFor(models, agent, tool) {
  const a = (models.agents || {})[agent] || { role: 'builder', effort: 'medium' };
  const role = (models.roles || {})[a.role] || {};
  const model = role[tool] || 'inherit';
  return { model, effort: a.effort || 'medium', role: a.role };
}

function renderClaudeAgent(t, models) {
  const { model, effort } = modelFor(models, t.name, 'claude-code');
  const lines = ['---', `name: ${t.name}`, `description: ${t.description}`, `tools: ${t.tools}`];
  if (model !== 'inherit') lines.push(`model: ${model}`);
  if (effort) lines.push(`effort: ${effort}`);
  lines.push('---', t.body, '');
  return lines.join('\n');
}

function renderOpencodeAgent(t, models) {
  const { model } = modelFor(models, t.name, 'opencode');
  const lines = ['---', `description: ${t.description}`, 'mode: subagent'];
  if (model !== 'inherit') lines.push(`model: ${model}`);
  lines.push('---', t.body, '');
  return lines.join('\n');
}

// ---------- Agent Skill (agentskills.io format) ----------
const SKILL_DESCRIPTION =
  'Staff-level engineering workflow for coding agents: ask and teach, debug to root cause, plan with zero open questions, ' +
  'spec-driven development (planner writes executable specs, builder sub-agents implement), independent review, ' +
  'validated multi-agent orchestration, context handoff, and rules that improve from corrections. Use for any software ' +
  'engineering task in a repository (questions, bugs, features, PRDs/TRDs, reviews) or when the user mentions Keelson.';

function rewriteForSkill(text) {
  return text
    .replace(/\.keelson\/(playbooks|roles|evals)\//g, 'references/$1/')
    .replace(/\.keelson\/templates\.md/g, 'references/templates.md')
    .replace(/\.keelson\/models\.yaml/g, '.keelson/models.yaml (or references/models.yaml if the project has none)');
}

function skillFiles() {
  const files = [];
  const body = `# Keelson

Read \`references/persona.md\` now and follow it for this whole session: it is the full Keelson instruction set (non-negotiables, modes, gates, orchestration, handoff, learning).

Path mapping for this skill install:
- \`playbooks/…\`, \`roles/…\`, \`evals/…\` and \`templates.md\` live under \`references/\` next to this file.
- Team memory lives in the project at \`.keelson/memory/\` and \`docs/agent/\`. If those files don't exist, create them from the templates only after the engineer approves.
- Stack profile: use \`.keelson/profile.md\` if the project has one; otherwise \`references/profiles/generic.md\` (auto-detect the stack from the repo).
- Model roles: \`.keelson/models.yaml\` if present, else \`references/models.yaml\`.

For the full install (hooks, pinned sub-agents, team memory), run \`npx github:abhishek305/keelson init\` in the repo.
`;
  files.push({ rel: 'SKILL.md', content: `---\nname: keelson\ndescription: ${SKILL_DESCRIPTION}\n---\n\n${body}` });
  files.push({ rel: 'references/persona.md', content: rewriteForSkill(personaText()) });
  for (const f of coreFiles()) {
    files.push({ rel: f.rel.replace(/^\.keelson\//, 'references/'), content: rewriteForSkill(f.content) });
  }
  files.push({ rel: 'references/models.yaml', content: readText(path.join(CORE, 'keelson', 'models.yaml')) });
  for (const p of profiles()) files.push({ rel: `references/profiles/${p}.md`, content: profileText(p) });
  return files;
}

// ---------- Claude Code plugin ----------
function pluginFiles() {
  const models = loadModels();
  const files = [];
  files.push({
    rel: '.claude-plugin/plugin.json',
    content:
      JSON.stringify(
        {
          name: 'keelson',
          version: VERSION,
          description: 'Keelson: staff-level engineering agent with spec-driven development, validated sub-agents, context handoff and self-improving rules.',
          author: { name: 'Abhishek Ezhava' },
          license: 'MIT',
          repository: `https://github.com/${REPO}`,
          homepage: `https://github.com/${REPO}`,
          keywords: ['agents', 'sdlc', 'spec-driven', 'subagents', 'code-review', 'handoff'],
        },
        null,
        2,
      ) + '\n',
  });
  files.push({
    rel: 'README.md',
    content: `# Keelson plugin for Claude Code

Keelson turns Claude Code into a staff-level engineering partner: it answers and teaches, debugs to the root cause, plans with zero open questions, runs spec-driven development (a planner writes executable specs, builder sub-agents implement them), validates every sub-agent's output, hands off long sessions before they degrade, and improves its rules from your corrections. You approve every gate.

Install (Claude Code 2.1.275 or later):

    /plugin install keelson --marketplace ${REPO}

This plugin bundles the \`keelson\` skill, eleven role sub-agents and the guard, context and resume hooks. For pinned team memory and the context status line, also run \`npx github:abhishek305/keelson init\` in your repo.

Docs: https://github.com/${REPO}
`,
  });
  files.push({ rel: '.claude-plugin/icon.png', content: require('node:fs').readFileSync(path.join(ADAPTERS, 'claude-code', 'icon.png')) });
  for (const f of skillFiles()) files.push({ rel: `skills/keelson/${f.rel}`, content: f.content });
  for (const t of agentTemplates()) {
    const body = t.body.replace(
      /Read `\.keelson\/roles\/([\w-]+)\.md`/g,
      'Read `.keelson/roles/$1.md` (or, if the project has no `.keelson/` folder, `references/roles/$1.md` in the keelson skill)',
    );
    files.push({ rel: `agents/${t.name}.md`, content: renderClaudeAgent({ ...t, body }, models) });
  }
  const hookDir = path.join(ADAPTERS, 'claude-code', 'hooks');
  for (const f of listFiles(hookDir)) files.push({ rel: `hooks/${f}`, content: readText(path.join(hookDir, f)), mode: 0o755 });
  const settings = JSON.parse(readText(path.join(ADAPTERS, 'claude-code', 'settings.json')));
  const hooks = JSON.parse(JSON.stringify(settings.hooks).replaceAll('${CLAUDE_PROJECT_DIR}/.claude/hooks', '${CLAUDE_PLUGIN_ROOT}/hooks'));
  files.push({ rel: 'hooks/hooks.json', content: JSON.stringify({ hooks }, null, 2) + '\n' });
  return files;
}

function marketplaceJson() {
  return (
    JSON.stringify(
      {
        name: 'keelson',
        owner: { name: 'Abhishek Ezhava' },
        description: 'Keelson plugins for Claude Code',
        plugins: [
          {
            name: 'keelson',
            source: './plugins/keelson',
            description: 'Staff-level engineering agent: spec-driven development, validated sub-agents, context handoff, self-improving rules.',
          },
        ],
      },
      null,
      2,
    ) + '\n'
  );
}

// ---------- ChatGPT pack ----------
function chatgptFiles() {
  const dir = path.join(CORE, 'keelson');
  const join = (sub) =>
    listFiles(path.join(dir, sub))
      .map((f) => `\n\n<!-- file: ${sub}/${f} -->\n\n` + readText(path.join(dir, sub, f)))
      .join('');
  const note = (t) => `# Keelson ${t} (knowledge file, v${VERSION})\nPaths like \`.keelson/...\` refer to sections in these knowledge files.`;
  return [
    { rel: 'instructions.md', content: readText(path.join(ADAPTERS, 'chatgpt', 'instructions.md')) },
    { rel: 'keelson-playbooks.md', content: note('playbooks') + join('playbooks') + join('evals') },
    { rel: 'keelson-roles.md', content: note('roles') + join('roles') },
    { rel: 'keelson-templates.md', content: note('templates') + '\n\n' + readText(path.join(dir, 'templates.md')) },
  ];
}

module.exports = {
  REPO,
  coreFiles,
  seedFiles,
  profiles,
  profileText,
  personaText,
  loadModels,
  agentTemplates,
  renderClaudeAgent,
  renderOpencodeAgent,
  skillFiles,
  pluginFiles,
  marketplaceJson,
  chatgptFiles,
  modelFor,
};

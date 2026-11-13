#!/usr/bin/env node
'use strict';
const path = require('node:path');
const readline = require('node:readline/promises');
const { VERSION, Writer } = require('../lib/util');
const { TOOLS, install, doctor, detectTools } = require('../lib/install');
const B = require('../lib/build');

const HELP = `keelson ${VERSION}: a staff-level engineering agent for any AI coding tool

Run with:  npx github:abhishek305/keelson <command>   (always the latest version from GitHub)

Commands:
  init      [--tools a,b] [--profile name] [--dir path] [--yes] [--dry-run]   Set up Keelson in a repo
  update    [--dir path] [--dry-run]       Update kit files; never touches team memory
  doctor    [--dir path]                   Check the install
  chatgpt   [--out dir]                    Write the ChatGPT pack (instructions + knowledge files)
  profiles                                 List stack profiles

Tools:    ${TOOLS.join(', ')}
Profiles: ${B.profiles().join(', ')}
Docs:     https://github.com/${B.REPO}`;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) args[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) args[k] = argv[++i];
      else args[k] = true;
    } else args._.push(a);
  }
  return args;
}

function report(actions, dryRun) {
  const icon = { create: '+', update: '~', warn: '!' };
  for (const a of actions) {
    if (a.op === 'warn') console.log(`  ! ${a.note}`);
    else console.log(`  ${icon[a.op]} ${a.path}${a.note ? `  (${a.note})` : ''}`);
  }
  if (!actions.length) console.log('  Everything is up to date.');
  if (dryRun) console.log('\nDry run: nothing was written.');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (args.version || args.v) return console.log(VERSION);
  if (!cmd || args.help || args.h || cmd === 'help') return console.log(HELP);
  const dir = path.resolve(args.dir || process.cwd());
  const dryRun = !!args['dry-run'];

  if (cmd === 'profiles') return console.log(B.profiles().join('\n'));

  if (cmd === 'chatgpt') {
    const out = path.resolve(args.out || 'keelson-chatgpt');
    const w = new Writer(out, { dryRun });
    for (const f of B.chatgptFiles()) w.write(f.rel, f.content);
    report(w.actions, dryRun);
    return console.log(`\nPaste instructions.md into a Custom GPT or Project; upload the other files as knowledge.`);
  }

  if (cmd === 'init' || cmd === 'update') {
    let tools = args.tools ? String(args.tools).split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    let profile = args.profile;
    if (cmd === 'init' && !args.yes && process.stdin.isTTY && (!tools || !profile)) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      if (!tools) {
        const detected = detectTools(new Writer(dir, { dryRun: true }));
        const def = (detected.length ? detected : ['claude-code', 'codex', 'opencode', 'cursor']).join(',');
        const ans = await rl.question(`Tools to set up (${TOOLS.join(', ')})\n  [${def}]: `);
        tools = (ans.trim() || def).split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (!profile) {
        const ans = await rl.question(`Stack profile (${B.profiles().join(', ')})\n  [generic]: `);
        profile = ans.trim() || 'generic';
      }
      rl.close();
    }
    const res = install(dir, { tools, profile, dryRun });
    console.log(`Keelson ${VERSION} → ${dir}\nTools: ${res.tools.join(', ')} · Profile: ${res.profile}\n`);
    report(res.actions, dryRun);
    if (!dryRun && cmd === 'init') {
      console.log(`\nNext:
  1. Review the changes (git diff), then commit everything except .keelson/memory/local/.
  2. Personal rules: cp .keelson/memory/local/my-rules.example.md .keelson/memory/local/my-rules.md
  3. Add 3–5 real repo facts to .keelson/memory/team-rules.md (test command, data access pattern, error type).
  4. Start your agent and say: "Read AGENTS.md and confirm which Keelson files you loaded."`);
    }
    return;
  }

  if (cmd === 'doctor') {
    const { ok, issues } = doctor(dir);
    for (const o of ok) console.log(`  ✓ ${o}`);
    for (const i of issues) console.log(`  ✗ ${i}`);
    process.exitCode = issues.length ? 1 : 0;
    return;
  }

  console.error(`Unknown command "${cmd}".\n\n${HELP}`);
  process.exitCode = 2;
}

main().catch((e) => {
  console.error(`keelson: ${e.message}`);
  process.exitCode = 1;
});

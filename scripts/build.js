#!/usr/bin/env node
'use strict';
// Regenerates committed artifacts from core/ and adapters/. CI fails if they're stale.
//   skills/keelson/            Agent Skill (for `npx skills add abhishek305/keelson`)
//   plugins/keelson/           Claude Code plugin
//   .claude-plugin/marketplace.json
//   dist/chatgpt/              ChatGPT pack (not committed)
const fs = require('node:fs');
const path = require('node:path');
const B = require('../lib/build');

const ROOT = path.resolve(__dirname, '..');

function writeTree(dir, files) {
  fs.rmSync(dir, { recursive: true, force: true });
  for (const f of files) {
    const p = path.join(dir, f.rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, f.content);
    if (f.mode) fs.chmodSync(p, f.mode);
  }
  return files.length;
}

const n1 = writeTree(path.join(ROOT, 'skills', 'keelson'), B.skillFiles());
const n2 = writeTree(path.join(ROOT, 'plugins', 'keelson'), B.pluginFiles());
fs.mkdirSync(path.join(ROOT, '.claude-plugin'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), B.marketplaceJson());
const n3 = writeTree(path.join(ROOT, 'dist', 'chatgpt'), B.chatgptFiles());
console.log(`built: skills/keelson (${n1} files), plugins/keelson (${n2} files), marketplace.json, dist/chatgpt (${n3} files)`);

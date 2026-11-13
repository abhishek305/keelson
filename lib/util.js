'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PKG_ROOT = path.resolve(__dirname, '..');
const VERSION = require(path.join(PKG_ROOT, 'package.json')).version;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full));
  }
  return out.sort();
}

/** Minimal YAML subset: nested maps by indentation, `key: value`, `key: { a: b, c: d }`, # comments. */
function parseYaml(text) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+#.*$/, '').replace(/^#.*$/, '');
    if (!line.trim()) continue;
    const indent = line.match(/^ */)[0].length;
    const m = line.trim().match(/^([\w.-]+):\s*(.*)$/);
    if (!m) throw new Error(`Unsupported YAML line: ${raw}`);
    const [, key, val] = m;
    while (stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    if (val === '') {
      parent[key] = {};
      stack.push({ indent, obj: parent[key] });
    } else if (val.startsWith('{')) {
      const inner = val.replace(/^\{|\}$/g, '').trim();
      parent[key] = {};
      if (inner) {
        for (const pair of inner.split(',')) {
          const [k, v] = pair.split(':').map((x) => x.trim());
          parent[key][k] = v;
        }
      }
    } else {
      parent[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return root;
}

/** Insert or replace a marked block. `style` is 'md' (HTML comment) or 'hash' (# comment). */
function upsertBlock(existing, content, style = 'md') {
  const [open, close] =
    style === 'hash'
      ? ['# keelson:start (managed by keelson, edit outside this block)', '# keelson:end']
      : ['<!-- keelson:start (managed by keelson, edit outside this block) -->', '<!-- keelson:end -->'];
  const block = `${open}\n${content.trim()}\n${close}`;
  const re = style === 'hash' ? /# keelson:start[^\n]*\n[\s\S]*?# keelson:end/ : /<!-- keelson:start[^\n]*-->\n[\s\S]*?<!-- keelson:end -->/;
  if (existing && re.test(existing)) return existing.replace(re, block);
  if (!existing || !existing.trim()) return block + '\n';
  return existing.replace(/\s*$/, '') + '\n\n' + block + '\n';
}

/** Collects intended writes so `--dry-run` can report them and tests can inspect them. */
class Writer {
  constructor(root, { dryRun = false, log = console.log } = {}) {
    this.root = root;
    this.dryRun = dryRun;
    this.log = log;
    this.actions = [];
  }
  abs(rel) {
    return path.join(this.root, rel);
  }
  exists(rel) {
    return fs.existsSync(this.abs(rel));
  }
  read(rel) {
    return this.exists(rel) ? readText(this.abs(rel)) : null;
  }
  write(rel, content, { mode, note } = {}) {
    const prev = this.read(rel);
    if (prev === content) return 'unchanged';
    this.actions.push({ op: prev === null ? 'create' : 'update', path: rel, note });
    if (!this.dryRun) {
      fs.mkdirSync(path.dirname(this.abs(rel)), { recursive: true });
      fs.writeFileSync(this.abs(rel), content);
      if (mode) fs.chmodSync(this.abs(rel), mode);
    }
    return prev === null ? 'created' : 'updated';
  }
  /** Seed: create only if missing. Never overwrites team-owned files. */
  seed(rel, content) {
    if (this.exists(rel)) return 'kept';
    return this.write(rel, content, { note: 'seed' });
  }
  warn(msg) {
    this.actions.push({ op: 'warn', note: msg });
  }
}

module.exports = { PKG_ROOT, VERSION, sha, readText, listFiles, parseYaml, upsertBlock, Writer };

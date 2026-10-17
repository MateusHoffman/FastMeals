#!/usr/bin/env node
/**
 * Valida links relativos em *.md (ignora http(s), mailto, âncoras).
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

function walkMd(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkMd(full, out);
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

function resolveLink(fromFile, raw) {
  let target = raw.trim();
  if (/^(https?:|mailto:|#)/.test(target)) return null;
  target = target.split('#')[0];
  if (!target) return null;

  const base = dirname(fromFile);
  const abs = isAbsolute(target) ? target : resolve(base, target);
  return abs;
}

let fail = 0;

for (const md of walkMd(root)) {
  const text = readFileSync(md, 'utf8');
  let m;
  while ((m = LINK_RE.exec(text)) !== null) {
    const abs = resolveLink(md, m[2]);
    if (!abs) continue;
    if (existsSync(abs)) continue;
    console.error(`ERROR: ${md.replace(root + '/', '')} → ${m[2]}`);
    fail = 1;
  }
}

if (fail) process.exit(1);
console.log('OK: links Markdown relativos verificados');

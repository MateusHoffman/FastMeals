#!/usr/bin/env node
/**
 * Imprime contagens Vitest (backend + frontend) para docs e CI.
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function vitestCounts(packageDir) {
  const out = execSync('npm test --silent', {
    cwd: join(root, packageDir),
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  const files = [...out.matchAll(/Test Files\s+(\d+)\s+passed/g)].pop();
  const tests = [...out.matchAll(/Tests\s+(\d+)\s+passed/g)].pop();
  if (!tests) {
    throw new Error(`Não foi possível parsear saída Vitest em ${packageDir}`);
  }
  return {
    files: files ? Number(files[1]) : null,
    tests: Number(tests[1]),
  };
}

const backend = vitestCounts('backend');
const frontend = vitestCounts('frontend');

const summary = {
  backend,
  frontend,
  totalTests: backend.tests + frontend.tests,
};

console.log(JSON.stringify(summary, null, 2));
console.log(
  `\nResumo: backend ${backend.tests} testes (${backend.files ?? '?'} arquivos) · frontend ${frontend.tests} testes (${frontend.files ?? '?'} arquivos) · total ${summary.totalTests}`,
);

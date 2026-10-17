import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Caminho canônico do dataset oficial do desafio: `<repo>/seed/data.json`.
 * Ordem: cwd Docker (/app/seed), backend local (../seed), relativo ao prisma/.
 */
export function resolveSeedDataPath(): string {
  const candidates = [
    resolve(process.cwd(), 'seed/data.json'),
    resolve(process.cwd(), '../seed/data.json'),
    resolve(here, '../../seed/data.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    `seed/data.json not found (tried: ${candidates.join(', ')})`,
  );
}

export function readSeedDataJson(): string {
  const path = resolveSeedDataPath();
  return readFileSync(path, 'utf-8');
}

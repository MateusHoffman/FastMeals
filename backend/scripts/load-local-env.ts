import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Carrega `.env` da raiz do repo (e backend/) sem sobrescrever variáveis já definidas. */
export function loadLocalEnv(): void {
  const candidates = [
    resolve(process.cwd(), '../.env'),
    resolve(process.cwd(), '.env'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }

  // Docker Compose expõe Postgres em 5433 no host (ver docker-compose.yml).
  process.env.DATABASE_URL ??=
    'postgresql://fastmeals:fastmeals123@127.0.0.1:5433/fastmeals';
}

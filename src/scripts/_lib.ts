import 'dotenv/config';
import { parseArgs } from 'node:util';
import * as readline from 'node:readline';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export function createPrisma(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const isColor = process.stdout.isTTY !== false;
export const c = {
  green: (s: string) => (isColor ? `\x1b[32m${s}\x1b[0m` : s),
  red: (s: string) => (isColor ? `\x1b[31m${s}\x1b[0m` : s),
  yellow: (s: string) => (isColor ? `\x1b[33m${s}\x1b[0m` : s),
  bold: (s: string) => (isColor ? `\x1b[1m${s}\x1b[0m` : s),
  dim: (s: string) => (isColor ? `\x1b[2m${s}\x1b[0m` : s),
};

export function die(msg: string): never {
  console.error(c.red(`Ошибка: ${msg}`));
  process.exit(1);
}

export async function confirm(prompt: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${prompt} [y/N]: `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

type ArgSpec = Record<
  string,
  { type: 'string' | 'boolean'; short?: string; default?: string | boolean }
>;

export function parseArgsTyped<T extends Record<string, string | boolean | undefined>>(
  spec: ArgSpec,
): T {
  const options: Record<string, { type: 'string' | 'boolean'; short?: string; default?: string | boolean }> = {};
  for (const [key, val] of Object.entries(spec)) {
    options[key] = { type: val.type, ...(val.short ? { short: val.short } : {}), ...(val.default !== undefined ? { default: val.default } : {}) };
  }

  const { values } = parseArgs({ options, strict: false });
  return values as T;
}

export function formatRublesCli(kopecks: number): string {
  const rubles = Math.floor(kopecks / 100);
  return `${rubles.toLocaleString('ru-RU')} \u20BD`;
}

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

vi.mock('dotenv/config', () => ({}));
vi.mock('@/generated/prisma/client', () => ({
  PrismaClient: vi.fn(),
}));
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: vi.fn(),
}));

import { parseArgsTyped, formatRublesCli, c } from '../_lib';

describe('parseArgsTyped', () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    process.argv = ['node', 'script.ts'];
  });

  afterAll(() => {
    process.argv = originalArgv;
  });

  it('парсит string-аргументы', () => {
    process.argv = ['node', 'script.ts', '--email=test@test.com', '--amount=500'];

    const args = parseArgsTyped<{ email?: string; amount?: string }>({
      email: { type: 'string' },
      amount: { type: 'string' },
    });

    expect(args.email).toBe('test@test.com');
    expect(args.amount).toBe('500');
  });

  it('парсит boolean-аргументы', () => {
    process.argv = ['node', 'script.ts', '--yes'];

    const args = parseArgsTyped<{ yes?: boolean }>({
      yes: { type: 'boolean', default: false },
    });

    expect(args.yes).toBe(true);
  });

  it('использует default для отсутствующих аргументов', () => {
    process.argv = ['node', 'script.ts'];

    const args = parseArgsTyped<{ limit?: string; verbose?: boolean }>({
      limit: { type: 'string', default: '50' },
      verbose: { type: 'boolean', default: false },
    });

    expect(args.limit).toBe('50');
    expect(args.verbose).toBe(false);
  });

  it('возвращает undefined для отсутствующих аргументов без default', () => {
    process.argv = ['node', 'script.ts'];

    const args = parseArgsTyped<{ email?: string }>({
      email: { type: 'string' },
    });

    expect(args.email).toBeUndefined();
  });
});

describe('formatRublesCli', () => {
  it('форматирует копейки в рубли', () => {
    expect(formatRublesCli(10000)).toBe('100 \u20BD');
  });

  it('0 копеек → 0', () => {
    expect(formatRublesCli(0)).toBe('0 \u20BD');
  });

  it('округляет вниз', () => {
    expect(formatRublesCli(99)).toBe('0 \u20BD');
    expect(formatRublesCli(100)).toBe('1 \u20BD');
  });
});

describe('c (colors)', () => {
  it('green оборачивает текст', () => {
    const result = c.green('ok');
    expect(result).toContain('ok');
  });

  it('red оборачивает текст', () => {
    const result = c.red('err');
    expect(result).toContain('err');
  });
});

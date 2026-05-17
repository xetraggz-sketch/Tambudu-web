import { describe, it, expect, vi } from 'vitest';

vi.mock('@/generated/prisma/client', () => {
  const MockPrismaClient = vi.fn();
  return { PrismaClient: MockPrismaClient };
});

vi.mock('@prisma/adapter-pg', () => {
  const MockPrismaPg = vi.fn();
  return { PrismaPg: MockPrismaPg };
});

describe('prisma singleton', () => {
  it('возвращает один и тот же инстанс при повторном импорте', async () => {
    const { prisma: instance1 } = await import('../prisma');
    const { prisma: instance2 } = await import('../prisma');
    expect(instance1).toBe(instance2);
  });
});

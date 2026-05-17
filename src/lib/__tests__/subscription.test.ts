import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindUniqueOrThrow = vi.fn();
const mockUserUpdate = vi.fn();
const mockChargeUser = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUniqueOrThrow: (...args: unknown[]) => mockFindUniqueOrThrow(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    transaction: {
      create: vi.fn(),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
      mockTransaction(fn),
  },
}));

vi.mock('@/lib/balance', () => ({
  chargeUser: (...args: unknown[]) => mockChargeUser(...args),
}));

import { extendSubscription } from '@/lib/subscription-server';

describe('extendSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChargeUser.mockResolvedValue({ newBalance: 0 });
    mockUserUpdate.mockResolvedValue({});
    mockTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            findUniqueOrThrow: mockFindUniqueOrThrow,
            update: mockUserUpdate,
          },
          transaction: { create: vi.fn() },
        };
        return fn(tx);
      },
    );
  });

  it('без подписки — now + 30 дней', async () => {
    mockFindUniqueOrThrow.mockResolvedValue({
      subscriptionUntil: null,
    });

    const before = new Date();
    const result = await extendSubscription('u1');
    const after = new Date();

    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() + 30);
    const expectedMax = new Date(after);
    expectedMax.setDate(expectedMax.getDate() + 30);

    expect(result.newSubscriptionUntil.getTime()).toBeGreaterThanOrEqual(
      expectedMin.getTime() - 1000,
    );
    expect(result.newSubscriptionUntil.getTime()).toBeLessThanOrEqual(
      expectedMax.getTime() + 1000,
    );
    expect(mockChargeUser).toHaveBeenCalledOnce();
  });

  it('активная подписка — subscriptionUntil + 30 дней', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    mockFindUniqueOrThrow.mockResolvedValue({
      subscriptionUntil: futureDate,
    });

    const result = await extendSubscription('u1');

    const expected = new Date(futureDate);
    expected.setDate(expected.getDate() + 30);

    expect(Math.abs(result.newSubscriptionUntil.getTime() - expected.getTime())).toBeLessThan(
      1000,
    );
  });

  it('истёкшая подписка — now + 30 дней', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    mockFindUniqueOrThrow.mockResolvedValue({
      subscriptionUntil: pastDate,
    });

    const before = new Date();
    const result = await extendSubscription('u1');

    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() + 30);

    expect(result.newSubscriptionUntil.getTime()).toBeGreaterThanOrEqual(
      expectedMin.getTime() - 1000,
    );
  });
});

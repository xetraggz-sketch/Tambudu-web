import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindUniqueOrThrow = vi.fn();
const mockCount = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUniqueOrThrow: (...args: unknown[]) => mockFindUniqueOrThrow(...args),
    },
    event: {
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

import { canCreateEvent } from '@/lib/moderation';

describe('canCreateEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('юзер без подписки, 0 событий → canCreate=true', async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ subscriptionUntil: null });
    mockCount.mockResolvedValue(0);

    const result = await canCreateEvent('user-1');

    expect(result.canCreate).toBe(true);
    expect(result.currentCount).toBe(0);
    expect(result.isSubscriber).toBe(false);
  });

  it('юзер без подписки, 2 события → canCreate=true', async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ subscriptionUntil: null });
    mockCount.mockResolvedValue(2);

    const result = await canCreateEvent('user-1');

    expect(result.canCreate).toBe(true);
    expect(result.currentCount).toBe(2);
    expect(result.isSubscriber).toBe(false);
  });

  it('юзер без подписки, 3 события (PENDING/APPROVED) → canCreate=false', async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ subscriptionUntil: null });
    mockCount.mockResolvedValue(3);

    const result = await canCreateEvent('user-1');

    expect(result.canCreate).toBe(false);
    expect(result.currentCount).toBe(3);
    expect(result.isSubscriber).toBe(false);
    expect(result.reason).toBe('Лимит исчерпан');
  });

  it('с подпиской → canCreate=true независимо от количества', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    mockFindUniqueOrThrow.mockResolvedValue({ subscriptionUntil: futureDate });

    const result = await canCreateEvent('user-1');

    expect(result.canCreate).toBe(true);
    expect(result.isSubscriber).toBe(true);
    expect(mockCount).not.toHaveBeenCalled();
  });

  it('истёкшая подписка считается как без подписки', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    mockFindUniqueOrThrow.mockResolvedValue({ subscriptionUntil: pastDate });
    mockCount.mockResolvedValue(3);

    const result = await canCreateEvent('user-1');

    expect(result.canCreate).toBe(false);
    expect(result.isSubscriber).toBe(false);
  });

  it('запрос count фильтрует по PENDING и APPROVED (не REJECTED)', async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ subscriptionUntil: null });
    mockCount.mockResolvedValue(0);

    await canCreateEvent('user-1');

    const countArgs = mockCount.mock.calls[0]![0];
    expect(countArgs.where.status).toEqual({ in: ['PENDING', 'APPROVED'] });
    expect(countArgs.where.authorId).toBe('user-1');
    expect(countArgs.where.createdAt.gte).toBeInstanceOf(Date);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEventFindUnique = vi.fn();
const mockEventUpdate = vi.fn();
const mockChargeUser = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
      update: (...args: unknown[]) => mockEventUpdate(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
      mockTransaction(fn),
  },
}));

vi.mock('@/lib/balance', () => ({
  chargeUser: (...args: unknown[]) => mockChargeUser(...args),
  InsufficientBalanceError: class InsufficientBalanceError extends Error {
    available: number;
    required: number;
    constructor(available: number, required: number) {
      super('Недостаточно средств');
      this.name = 'InsufficientBalanceError';
      this.available = available;
      this.required = required;
    }
  },
}));

import { promoteEvent, EventNotAvailableError } from '@/lib/promotion';
import { InsufficientBalanceError } from '@/lib/balance';
import { PRICES } from '@/lib/constants';

const USER_ID = 'user-1';
const EVENT_ID = 'event-1';

function makeTx() {
  return {
    event: {
      findUnique: mockEventFindUnique,
      update: mockEventUpdate,
    },
    transaction: { create: vi.fn() },
    user: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe('promoteEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChargeUser.mockResolvedValue({ newBalance: 0 });
    mockEventUpdate.mockResolvedValue({});
    mockTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(makeTx()),
    );
  });

  it('продвигает событие без текущей промоакции — promotedUntil = now + 7 дней', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 10);

    mockEventFindUnique.mockResolvedValue({
      authorId: USER_ID,
      status: 'APPROVED',
      startsAt: futureStart,
      promotedUntil: null,
    });

    const before = new Date();
    const result = await promoteEvent(USER_ID, EVENT_ID);

    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() + PRICES.PROMOTION_DAYS);

    expect(result.promotedUntil.getTime()).toBeGreaterThanOrEqual(
      expectedMin.getTime() - 1000,
    );
    expect(mockChargeUser).toHaveBeenCalledWith(
      USER_ID,
      PRICES.PROMOTION_KOPECKS,
      'PROMOTION',
      { eventId: EVENT_ID, days: PRICES.PROMOTION_DAYS },
      expect.anything(),
    );
    expect(mockEventUpdate).toHaveBeenCalledWith({
      where: { id: EVENT_ID },
      data: { promotedUntil: result.promotedUntil },
    });
  });

  it('продлевает активную промоакцию — promotedUntil += 7 дней', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 30);

    const currentPromo = new Date();
    currentPromo.setDate(currentPromo.getDate() + 3);

    mockEventFindUnique.mockResolvedValue({
      authorId: USER_ID,
      status: 'APPROVED',
      startsAt: futureStart,
      promotedUntil: currentPromo,
    });

    const result = await promoteEvent(USER_ID, EVENT_ID);

    const expected = new Date(currentPromo);
    expected.setDate(expected.getDate() + PRICES.PROMOTION_DAYS);

    expect(
      Math.abs(result.promotedUntil.getTime() - expected.getTime()),
    ).toBeLessThan(1000);
  });

  it('не позволяет продвигать чужое событие', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 10);

    mockEventFindUnique.mockResolvedValue({
      authorId: 'other-user',
      status: 'APPROVED',
      startsAt: futureStart,
      promotedUntil: null,
    });

    await expect(promoteEvent(USER_ID, EVENT_ID)).rejects.toThrow(
      EventNotAvailableError,
    );
    expect(mockChargeUser).not.toHaveBeenCalled();
  });

  it('не позволяет продвигать прошедшее событие', async () => {
    const pastStart = new Date();
    pastStart.setDate(pastStart.getDate() - 1);

    mockEventFindUnique.mockResolvedValue({
      authorId: USER_ID,
      status: 'APPROVED',
      startsAt: pastStart,
      promotedUntil: null,
    });

    await expect(promoteEvent(USER_ID, EVENT_ID)).rejects.toThrow(
      EventNotAvailableError,
    );
    expect(mockChargeUser).not.toHaveBeenCalled();
  });

  it('пробрасывает InsufficientBalanceError при нехватке средств', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 10);

    mockEventFindUnique.mockResolvedValue({
      authorId: USER_ID,
      status: 'APPROVED',
      startsAt: futureStart,
      promotedUntil: null,
    });

    mockChargeUser.mockRejectedValue(
      new InsufficientBalanceError(100, PRICES.PROMOTION_KOPECKS),
    );

    await expect(promoteEvent(USER_ID, EVENT_ID)).rejects.toThrow(
      InsufficientBalanceError,
    );
  });
});

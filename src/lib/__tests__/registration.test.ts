import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addHours, subHours } from 'date-fns';

const mockEventFindUnique = vi.fn();
const mockRegFindUnique = vi.fn();
const mockRegCreate = vi.fn();
const mockRegUpdate = vi.fn();
const mockUserFindUniqueOrThrow = vi.fn();
const mockUserUpdate = vi.fn();
const mockTxCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
      mockTransaction(fn),
  },
}));

vi.mock('@/lib/balance', () => ({
  chargeUser: vi.fn(async (_uid: string, kopecks: number) => ({
    newBalance: 10000 - kopecks,
  })),
  refundUser: vi.fn(async (_uid: string, kopecks: number) => ({
    newBalance: 10000 + kopecks,
  })),
}));

import {
  registerForEvent,
  cancelRegistration,
  EventNotAvailableError,
  NoCapacityError,
  AlreadyRegisteredError,
} from '@/lib/registration';
import { chargeUser, refundUser } from '@/lib/balance';

function makeTx() {
  return {
    event: { findUnique: mockEventFindUnique },
    registration: {
      findUnique: mockRegFindUnique,
      create: mockRegCreate,
      update: mockRegUpdate,
    },
    user: {
      findUniqueOrThrow: mockUserFindUniqueOrThrow,
      update: mockUserUpdate,
    },
    transaction: { create: mockTxCreate },
  };
}

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt-1',
    status: 'APPROVED',
    startsAt: addHours(new Date(), 48),
    authorId: 'author-1',
    priceKopecks: 0,
    capacity: null,
    _count: { registrations: 3 },
    ...overrides,
  };
}

describe('registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(makeTx()),
    );
  });

  describe('registerForEvent', () => {
    it('записывает на бесплатное событие', async () => {
      mockEventFindUnique.mockResolvedValue(makeEvent());
      mockRegFindUnique.mockResolvedValue(null);
      const reg = { id: 'reg-1', status: 'ACTIVE', priceKopecksPaid: 0 };
      mockRegCreate.mockResolvedValue(reg);

      const result = await registerForEvent('u1', 'evt-1');

      expect(result).toEqual(reg);
      expect(chargeUser).not.toHaveBeenCalled();
    });

    it('записывает на платное событие и списывает деньги', async () => {
      mockEventFindUnique.mockResolvedValue(
        makeEvent({ priceKopecks: 1000 }),
      );
      mockRegFindUnique.mockResolvedValue(null);
      mockUserFindUniqueOrThrow.mockResolvedValue({
        subscriptionUntil: null,
      });
      const reg = { id: 'reg-1', status: 'ACTIVE', priceKopecksPaid: 1000 };
      mockRegCreate.mockResolvedValue(reg);

      await registerForEvent('u1', 'evt-1');

      expect(chargeUser).toHaveBeenCalledWith(
        'u1',
        1000,
        'EVENT_FEE',
        expect.objectContaining({ eventId: 'evt-1', discount: false }),
        expect.anything(),
      );
    });

    it('применяет скидку 5% для подписчика', async () => {
      mockEventFindUnique.mockResolvedValue(
        makeEvent({ priceKopecks: 1000 }),
      );
      mockRegFindUnique.mockResolvedValue(null);
      mockUserFindUniqueOrThrow.mockResolvedValue({
        subscriptionUntil: addHours(new Date(), 720),
      });
      mockRegCreate.mockResolvedValue({
        id: 'reg-1',
        status: 'ACTIVE',
        priceKopecksPaid: 950,
      });

      await registerForEvent('u1', 'evt-1');

      // Math.floor(1000 * 0.95) = 950
      expect(chargeUser).toHaveBeenCalledWith(
        'u1',
        950,
        'EVENT_FEE',
        expect.objectContaining({ discount: true }),
        expect.anything(),
      );
    });

    it('округляет скидку через Math.floor — 199 * 0.95 = 189', async () => {
      mockEventFindUnique.mockResolvedValue(
        makeEvent({ priceKopecks: 199 }),
      );
      mockRegFindUnique.mockResolvedValue(null);
      mockUserFindUniqueOrThrow.mockResolvedValue({
        subscriptionUntil: addHours(new Date(), 720),
      });
      mockRegCreate.mockResolvedValue({
        id: 'reg-1',
        status: 'ACTIVE',
        priceKopecksPaid: 189,
      });

      await registerForEvent('u1', 'evt-1');

      expect(chargeUser).toHaveBeenCalledWith(
        'u1',
        189,
        'EVENT_FEE',
        expect.anything(),
        expect.anything(),
      );
    });

    it('бросает NoCapacityError если нет мест', async () => {
      mockEventFindUnique.mockResolvedValue(
        makeEvent({ capacity: 5, _count: { registrations: 5 } }),
      );

      await expect(registerForEvent('u1', 'evt-1')).rejects.toThrow(
        NoCapacityError,
      );
    });

    it('бросает AlreadyRegisteredError если уже записан', async () => {
      mockEventFindUnique.mockResolvedValue(makeEvent());
      mockRegFindUnique.mockResolvedValue({
        id: 'reg-old',
        status: 'ACTIVE',
      });

      await expect(registerForEvent('u1', 'evt-1')).rejects.toThrow(
        AlreadyRegisteredError,
      );
    });

    it('повторная запись после отмены — update, а не create', async () => {
      mockEventFindUnique.mockResolvedValue(makeEvent());
      mockRegFindUnique.mockResolvedValue({
        id: 'reg-old',
        status: 'CANCELLED',
      });
      mockRegUpdate.mockResolvedValue({
        id: 'reg-old',
        status: 'ACTIVE',
        priceKopecksPaid: 0,
      });

      const result = await registerForEvent('u1', 'evt-1');

      expect(result.status).toBe('ACTIVE');
      expect(mockRegUpdate).toHaveBeenCalled();
      expect(mockRegCreate).not.toHaveBeenCalled();
    });

    it('бросает EventNotAvailableError на своё событие', async () => {
      mockEventFindUnique.mockResolvedValue(makeEvent());

      await expect(registerForEvent('author-1', 'evt-1')).rejects.toThrow(
        EventNotAvailableError,
      );
    });

    it('бросает EventNotAvailableError если событие в прошлом', async () => {
      mockEventFindUnique.mockResolvedValue(
        makeEvent({ startsAt: subHours(new Date(), 1) }),
      );

      await expect(registerForEvent('u1', 'evt-1')).rejects.toThrow(
        EventNotAvailableError,
      );
    });
  });

  describe('cancelRegistration', () => {
    it('отмена с возвратом за >= 24ч', async () => {
      mockRegFindUnique.mockResolvedValue({
        id: 'reg-1',
        status: 'ACTIVE',
        priceKopecksPaid: 1000,
        event: { startsAt: addHours(new Date(), 48) },
      });
      mockRegUpdate.mockResolvedValue({ id: 'reg-1', status: 'CANCELLED' });

      const result = await cancelRegistration('u1', 'evt-1');

      expect(result.refunded).toBe(1000);
      expect(refundUser).toHaveBeenCalledWith(
        'u1',
        1000,
        'REFUND',
        expect.objectContaining({ eventId: 'evt-1' }),
        expect.anything(),
      );
    });

    it('отмена без возврата за < 24ч', async () => {
      mockRegFindUnique.mockResolvedValue({
        id: 'reg-1',
        status: 'ACTIVE',
        priceKopecksPaid: 1000,
        event: { startsAt: addHours(new Date(), 10) },
      });
      mockRegUpdate.mockResolvedValue({ id: 'reg-1', status: 'CANCELLED' });

      const result = await cancelRegistration('u1', 'evt-1');

      expect(result.refunded).toBe(0);
      expect(refundUser).not.toHaveBeenCalled();
    });

    it('отмена бесплатного — без возврата', async () => {
      mockRegFindUnique.mockResolvedValue({
        id: 'reg-1',
        status: 'ACTIVE',
        priceKopecksPaid: 0,
        event: { startsAt: addHours(new Date(), 48) },
      });
      mockRegUpdate.mockResolvedValue({ id: 'reg-1', status: 'CANCELLED' });

      const result = await cancelRegistration('u1', 'evt-1');

      expect(result.refunded).toBe(0);
      expect(refundUser).not.toHaveBeenCalled();
    });

    it('нельзя отменить если событие уже началось', async () => {
      mockRegFindUnique.mockResolvedValue({
        id: 'reg-1',
        status: 'ACTIVE',
        priceKopecksPaid: 0,
        event: { startsAt: subHours(new Date(), 1) },
      });

      await expect(cancelRegistration('u1', 'evt-1')).rejects.toThrow(
        EventNotAvailableError,
      );
    });
  });
});

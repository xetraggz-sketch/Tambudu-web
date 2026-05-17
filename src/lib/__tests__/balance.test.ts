import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindUniqueOrThrow = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUniqueOrThrow: (...args: unknown[]) => mockFindUniqueOrThrow(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    transaction: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
      mockTransaction(fn),
  },
}));

import {
  chargeUser,
  refundUser,
  topupUser,
  InsufficientBalanceError,
} from '@/lib/balance';

describe('balance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: {
          findUniqueOrThrow: mockFindUniqueOrThrow,
          update: mockUpdate,
        },
        transaction: { create: mockCreate },
      };
      return fn(tx);
    });
  });

  describe('chargeUser', () => {
    it('списывает деньги при достаточном балансе', async () => {
      mockFindUniqueOrThrow.mockResolvedValue({ balanceKopecks: 5000 });
      mockUpdate.mockResolvedValue({ balanceKopecks: 4000 });
      mockCreate.mockResolvedValue({});

      const result = await chargeUser('u1', 1000, 'EVENT_FEE', { eventId: 'e1' });

      expect(result.newBalance).toBe(4000);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: { balanceKopecks: { decrement: 1000 } },
        }),
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u1',
            deltaKopecks: -1000,
            type: 'EVENT_FEE',
          }),
        }),
      );
    });

    it('бросает InsufficientBalanceError при нехватке средств', async () => {
      mockFindUniqueOrThrow.mockResolvedValue({ balanceKopecks: 500 });

      await expect(chargeUser('u1', 1000, 'EVENT_FEE')).rejects.toThrow(
        InsufficientBalanceError,
      );

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('InsufficientBalanceError содержит available и required', async () => {
      mockFindUniqueOrThrow.mockResolvedValue({ balanceKopecks: 300 });

      try {
        await chargeUser('u1', 1000, 'EVENT_FEE');
        expect.unreachable();
      } catch (e) {
        expect(e).toBeInstanceOf(InsufficientBalanceError);
        const err = e as InsufficientBalanceError;
        expect(err.available).toBe(300);
        expect(err.required).toBe(1000);
      }
    });
  });

  describe('refundUser', () => {
    it('увеличивает баланс', async () => {
      mockUpdate.mockResolvedValue({ balanceKopecks: 2000 });
      mockCreate.mockResolvedValue({});

      const result = await refundUser('u1', 500, 'REFUND', { eventId: 'e1' });

      expect(result.newBalance).toBe(2000);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { balanceKopecks: { increment: 500 } },
        }),
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deltaKopecks: 500,
            type: 'REFUND',
          }),
        }),
      );
    });
  });

  describe('topupUser', () => {
    it('вызывает refundUser с типом TOPUP', async () => {
      mockUpdate.mockResolvedValue({ balanceKopecks: 10000 });
      mockCreate.mockResolvedValue({});

      const result = await topupUser('u1', 10000);

      expect(result.newBalance).toBe(10000);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'TOPUP',
            deltaKopecks: 10000,
          }),
        }),
      );
    });
  });
});

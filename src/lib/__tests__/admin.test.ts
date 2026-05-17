import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEventFindUnique = vi.fn();
const mockEventUpdate = vi.fn();
const mockReportFindUnique = vi.fn();
const mockReportUpdate = vi.fn();
const mockReportUpdateMany = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockTopupUser = vi.fn();
const mockTransaction = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
      update: (...args: unknown[]) => mockEventUpdate(...args),
    },
    report: {
      findUnique: (...args: unknown[]) => mockReportFindUnique(...args),
      update: (...args: unknown[]) => mockReportUpdate(...args),
      updateMany: (...args: unknown[]) => mockReportUpdateMany(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}));

vi.mock('@/lib/balance', () => ({
  topupUser: (...args: unknown[]) => mockTopupUser(...args),
}));

vi.mock('@/lib/session', () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    user: { id: 'admin-1', role: 'ADMIN' },
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import {
  approveEventAction,
  rejectEventAction,
  adminTopupAction,
  toggleAdminAction,
  closeReportAction,
} from '@/app/admin/actions';

describe('Admin actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventUpdate.mockResolvedValue({});
    mockReportUpdate.mockResolvedValue({});
    mockUserUpdate.mockResolvedValue({});
    mockTopupUser.mockResolvedValue({ newBalance: 10000 });
  });

  describe('approveEventAction', () => {
    it('меняет статус на APPROVED', async () => {
      mockEventFindUnique.mockResolvedValue({ id: 'e1', status: 'PENDING' });

      const result = await approveEventAction('e1');

      expect(result.ok).toBe(true);
      expect(mockEventUpdate).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: { status: 'APPROVED' },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    });

    it('отклоняет не-PENDING событие', async () => {
      mockEventFindUnique.mockResolvedValue({ id: 'e1', status: 'APPROVED' });

      const result = await approveEventAction('e1');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('не на модерации');
      expect(mockEventUpdate).not.toHaveBeenCalled();
    });
  });

  describe('rejectEventAction', () => {
    it('требует причину минимум 3 символа', async () => {
      const result = await rejectEventAction('e1', 'аб');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('минимум 3');
      expect(mockEventUpdate).not.toHaveBeenCalled();
    });

    it('отклоняет с причиной', async () => {
      mockEventFindUnique.mockResolvedValue({ id: 'e1', status: 'PENDING' });

      const result = await rejectEventAction('e1', 'Неподходящий контент');

      expect(result.ok).toBe(true);
      expect(mockEventUpdate).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: { status: 'REJECTED', rejectionReason: 'Неподходящий контент' },
      });
    });
  });

  describe('adminTopupAction', () => {
    it('увеличивает баланс и создаёт Transaction', async () => {
      mockUserFindUnique.mockResolvedValue({ id: 'u1' });

      const result = await adminTopupAction({
        userId: 'u1',
        rubles: 100,
        comment: 'Тест',
      });

      expect(result.ok).toBe(true);
      expect(mockTopupUser).toHaveBeenCalledWith('u1', 10000, {
        adminId: 'admin-1',
        comment: 'Тест',
      });
    });

    it('не принимает сумму 0', async () => {
      const result = await adminTopupAction({
        userId: 'u1',
        rubles: 0,
      });

      expect(result.ok).toBe(false);
      expect(mockTopupUser).not.toHaveBeenCalled();
    });
  });

  describe('toggleAdminAction', () => {
    it('запрещает менять свою роль', async () => {
      const result = await toggleAdminAction('admin-1');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('свою роль');
    });

    it('переключает USER → ADMIN', async () => {
      mockUserFindUnique.mockResolvedValue({ role: 'USER' });

      const result = await toggleAdminAction('u1');

      expect(result.ok).toBe(true);
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { role: 'ADMIN' },
      });
    });
  });

  describe('closeReportAction', () => {
    it('закрывает жалобу', async () => {
      mockReportFindUnique.mockResolvedValue({ id: 'r1', status: 'OPEN' });

      const result = await closeReportAction('r1');

      expect(result.ok).toBe(true);
      expect(mockReportUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'r1' },
          data: expect.objectContaining({
            status: 'RESOLVED',
            resolvedById: 'admin-1',
          }),
        }),
      );
    });
  });
});

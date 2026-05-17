import type { TransactionType } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

type JsonMeta = Record<string, string | number | boolean>;

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export class InsufficientBalanceError extends Error {
  constructor(
    public readonly available: number,
    public readonly required: number,
  ) {
    super('Недостаточно средств');
    this.name = 'InsufficientBalanceError';
  }
}

export async function chargeUser(
  userId: string,
  kopecks: number,
  type: TransactionType,
  meta?: JsonMeta,
  tx?: TxClient,
): Promise<{ newBalance: number }> {
  const run = async (client: TxClient) => {
    const user = await client.user.findUniqueOrThrow({
      where: { id: userId },
      select: { balanceKopecks: true },
    });

    if (user.balanceKopecks < kopecks) {
      throw new InsufficientBalanceError(user.balanceKopecks, kopecks);
    }

    const updated = await client.user.update({
      where: { id: userId },
      data: { balanceKopecks: { decrement: kopecks } },
      select: { balanceKopecks: true },
    });

    await client.transaction.create({
      data: {
        userId,
        deltaKopecks: -kopecks,
        type,
        meta: meta ?? undefined,
      },
    });

    return { newBalance: updated.balanceKopecks };
  };

  if (tx) return run(tx);
  return prisma.$transaction(run);
}

export async function refundUser(
  userId: string,
  kopecks: number,
  type: TransactionType,
  meta?: JsonMeta,
  tx?: TxClient,
): Promise<{ newBalance: number }> {
  const run = async (client: TxClient) => {
    const updated = await client.user.update({
      where: { id: userId },
      data: { balanceKopecks: { increment: kopecks } },
      select: { balanceKopecks: true },
    });

    await client.transaction.create({
      data: {
        userId,
        deltaKopecks: kopecks,
        type,
        meta: meta ?? undefined,
      },
    });

    return { newBalance: updated.balanceKopecks };
  };

  if (tx) return run(tx);
  return prisma.$transaction(run);
}

export async function topupUser(
  userId: string,
  kopecks: number,
  meta?: JsonMeta,
): Promise<{ newBalance: number }> {
  return refundUser(userId, kopecks, 'TOPUP', meta);
}

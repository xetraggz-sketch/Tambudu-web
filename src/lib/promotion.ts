import { prisma } from '@/lib/prisma';
import { chargeUser } from '@/lib/balance';
import { PRICES } from '@/lib/constants';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export class EventNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventNotAvailableError';
  }
}

export async function promoteEvent(
  userId: string,
  eventId: string,
): Promise<{ promotedUntil: Date }> {
  return prisma.$transaction(async (tx: TxClient) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        authorId: true,
        status: true,
        startsAt: true,
        promotedUntil: true,
      },
    });

    if (!event) {
      throw new EventNotAvailableError('Событие не найдено');
    }

    if (event.authorId !== userId) {
      throw new EventNotAvailableError('Можно продвигать только свои события');
    }

    if (event.status !== 'APPROVED') {
      throw new EventNotAvailableError('Можно продвигать только опубликованные события');
    }

    if (event.startsAt <= new Date()) {
      throw new EventNotAvailableError('Нельзя продвигать прошедшее событие');
    }

    await chargeUser(
      userId,
      PRICES.PROMOTION_KOPECKS,
      'PROMOTION',
      { eventId, days: PRICES.PROMOTION_DAYS },
      tx,
    );

    const now = new Date();
    const base =
      event.promotedUntil && event.promotedUntil > now
        ? event.promotedUntil
        : now;
    const newPromotedUntil = new Date(base);
    newPromotedUntil.setDate(newPromotedUntil.getDate() + PRICES.PROMOTION_DAYS);

    await tx.event.update({
      where: { id: eventId },
      data: { promotedUntil: newPromotedUntil },
    });

    return { promotedUntil: newPromotedUntil };
  });
}

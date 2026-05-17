import { prisma } from '@/lib/prisma';
import { chargeUser, refundUser } from '@/lib/balance';
import { PRICES, LIMITS } from '@/lib/constants';
import type { Registration } from '@/generated/prisma/client';

export class EventNotAvailableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'EventNotAvailableError';
  }
}

export class NoCapacityError extends Error {
  constructor() {
    super('Нет свободных мест');
    this.name = 'NoCapacityError';
  }
}

export class AlreadyRegisteredError extends Error {
  constructor() {
    super('Вы уже записаны');
    this.name = 'AlreadyRegisteredError';
  }
}

export async function registerForEvent(
  userId: string,
  eventId: string,
): Promise<Registration> {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { registrations: { where: { status: 'ACTIVE' } } } },
      },
    });

    if (!event || event.status !== 'APPROVED') {
      throw new EventNotAvailableError('Событие не доступно');
    }
    if (event.startsAt <= new Date()) {
      throw new EventNotAvailableError('Событие уже началось');
    }
    if (event.authorId === userId) {
      throw new EventNotAvailableError('Нельзя записаться на своё событие');
    }
    if (event.capacity != null && event._count.registrations >= event.capacity) {
      throw new NoCapacityError();
    }

    const existing = await tx.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing?.status === 'ACTIVE') {
      throw new AlreadyRegisteredError();
    }

    let priceKopecksPaid = 0;
    if (event.priceKopecks > 0) {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { subscriptionUntil: true },
      });
      const isSub =
        !!user.subscriptionUntil &&
        new Date(user.subscriptionUntil) > new Date();

      // 5% скидка для подписчиков, округление floor (бизнес-правило)
      priceKopecksPaid = isSub
        ? Math.floor(
            event.priceKopecks *
              (1 - PRICES.SUBSCRIBER_DISCOUNT_PERCENT / 100),
          )
        : event.priceKopecks;

      await chargeUser(userId, priceKopecksPaid, 'EVENT_FEE', {
        eventId,
        originalPrice: event.priceKopecks,
        discount: isSub,
      }, tx);
    }

    if (existing) {
      return tx.registration.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', priceKopecksPaid },
      });
    }

    return tx.registration.create({
      data: {
        userId,
        eventId,
        status: 'ACTIVE',
        priceKopecksPaid,
      },
    });
  });
}

export async function cancelRegistration(
  userId: string,
  eventId: string,
): Promise<{ refunded: number }> {
  return prisma.$transaction(async (tx) => {
    const reg = await tx.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
      include: { event: { select: { startsAt: true } } },
    });

    if (!reg || reg.status !== 'ACTIVE') {
      throw new EventNotAvailableError('Регистрация не найдена');
    }

    const now = new Date();
    if (reg.event.startsAt <= now) {
      throw new EventNotAvailableError('Событие уже началось');
    }

    let refunded = 0;
    const hoursUntilStart =
      (reg.event.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (
      reg.priceKopecksPaid > 0 &&
      hoursUntilStart >= LIMITS.CANCEL_HOURS_BEFORE_START
    ) {
      await refundUser(userId, reg.priceKopecksPaid, 'REFUND', {
        eventId,
      }, tx);
      refunded = reg.priceKopecksPaid;
    }

    await tx.registration.update({
      where: { id: reg.id },
      data: { status: 'CANCELLED' },
    });

    return { refunded };
  });
}

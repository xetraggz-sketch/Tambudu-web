import { prisma } from '@/lib/prisma';
import { LIMITS } from '@/lib/constants';

export type CanCreateResult = {
  canCreate: boolean;
  currentCount: number;
  isSubscriber: boolean;
  reason?: string;
};

export async function canCreateEvent(userId: string): Promise<CanCreateResult> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { subscriptionUntil: true },
  });

  const isSub =
    !!user.subscriptionUntil && new Date(user.subscriptionUntil) > new Date();

  if (isSub) {
    return { canCreate: true, currentCount: 0, isSubscriber: true };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const currentCount = await prisma.event.count({
    where: {
      authorId: userId,
      createdAt: { gte: monthStart },
      status: { in: ['PENDING', 'APPROVED'] },
    },
  });

  if (currentCount >= LIMITS.FREE_EVENTS_PER_MONTH) {
    return {
      canCreate: false,
      currentCount,
      isSubscriber: false,
      reason: 'Лимит исчерпан',
    };
  }

  return { canCreate: true, currentCount, isSubscriber: false };
}

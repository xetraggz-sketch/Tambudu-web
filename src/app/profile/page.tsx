import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ProfileClient } from '@/components/user/ProfileClient';

export const metadata: Metadata = {
  title: 'Профиль | ТамБуду',
};

export default async function ProfilePage() {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  const now = new Date();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarEmoji: true,
      avatarImage: true,
      balanceKopecks: true,
      subscriptionUntil: true,
    },
  });

  const [transactions, upcomingRegs, pastRegs, myEvents, userReviews] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.registration.findMany({
      where: { userId, status: 'ACTIVE', event: { startsAt: { gte: now } } },
      orderBy: { event: { startsAt: 'asc' } },
      include: {
        event: {
          select: { id: true, title: true, category: true, startsAt: true },
        },
      },
    }),
    prisma.registration.findMany({
      where: { userId, status: 'ACTIVE', event: { startsAt: { lt: now } } },
      orderBy: { event: { startsAt: 'desc' } },
      include: {
        event: {
          select: { id: true, title: true, category: true, startsAt: true },
        },
      },
    }),
    prisma.event.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { registrations: { where: { status: 'ACTIVE' } } } },
      },
    }),
    prisma.review.findMany({
      where: { userId },
      select: { eventId: true },
    }),
  ]);

  const data = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarEmoji: user.avatarEmoji,
    hasAvatarImage: !!user.avatarImage,
    balanceKopecks: user.balanceKopecks,
    subscriptionUntil: user.subscriptionUntil?.toISOString() ?? null,
    upcomingRegistrations: upcomingRegs.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      priceKopecksPaid: r.priceKopecksPaid,
      event: {
        id: r.event.id,
        title: r.event.title,
        category: r.event.category,
        startsAt: r.event.startsAt.toISOString(),
      },
    })),
    pastRegistrations: pastRegs.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      priceKopecksPaid: r.priceKopecksPaid,
      event: {
        id: r.event.id,
        title: r.event.title,
        category: r.event.category,
        startsAt: r.event.startsAt.toISOString(),
      },
    })),
    myEvents: myEvents.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      startsAt: e.startsAt.toISOString(),
      status: e.status,
      _count: e._count,
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      deltaKopecks: t.deltaKopecks,
      type: t.type,
      meta: t.meta as Record<string, string | number | boolean> | null,
      createdAt: t.createdAt.toISOString(),
    })),
    reviewedEventIds: userReviews.map((r) => r.eventId),
  };

  return <ProfileClient data={data} />;
}

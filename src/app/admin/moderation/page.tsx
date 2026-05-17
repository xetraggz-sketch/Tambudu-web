import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ModerationList } from '@/components/admin/ModerationList';

export const metadata: Metadata = {
  title: 'Модерация | Админ | ТамБуду',
};

export default async function ModerationPage() {
  const events = await prisma.event.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarEmoji: true },
      },
    },
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="font-display text-2xl font-bold mb-6">Модерация</h1>
      {events.length === 0 ? (
        <div className="tb-card p-8 text-center">
          <p className="text-muted-foreground text-lg">Нет событий на модерации</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <ModerationList
              key={event.id}
              event={{
                id: event.id,
                title: event.title,
                description: event.description,
                category: event.category,
                startsAt: event.startsAt.toISOString(),
                endsAt: event.endsAt?.toISOString() ?? null,
                address: event.address,
                lat: event.lat,
                lng: event.lng,
                priceKopecks: event.priceKopecks,
                capacity: event.capacity,
                createdAt: event.createdAt.toISOString(),
                author: event.author,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

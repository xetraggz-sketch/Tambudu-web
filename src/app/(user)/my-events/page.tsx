import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MyEventCard } from '@/components/events/MyEventCard';

export const metadata: Metadata = {
  title: 'Мои события | ТамБуду',
};

export default async function MyEventsPage() {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  const events = await prisma.event.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { registrations: { where: { status: 'ACTIVE' } } } },
    },
  });

  const pending = events.filter((e) => e.status === 'PENDING');
  const approved = events.filter((e) => e.status === 'APPROVED');
  const rejected = events.filter((e) => e.status === 'REJECTED');

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Мои события</h1>
        <Link
          href="/create-event"
          className={buttonVariants({ size: 'sm' })}
        >
          <CalendarPlus className="size-4 mr-1.5" />
          Создать
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="tb-card p-8 text-center">
          <p className="text-muted-foreground mb-4">
            У вас пока нет событий
          </p>
          <Link
            href="/create-event"
            className={buttonVariants()}
          >
            Создать первое событие
          </Link>
        </div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending">
              На модерации ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Опубликованы ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Отклонены ({rejected.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {pending.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                Нет событий на модерации
              </p>
            ) : (
              pending.map((e) => (
                <MyEventCard key={e.id} event={e} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-4 space-y-3">
            {approved.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                Нет опубликованных событий
              </p>
            ) : (
              approved.map((e) => (
                <MyEventCard key={e.id} event={e} />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-4 space-y-3">
            {rejected.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                Нет отклонённых событий
              </p>
            ) : (
              rejected.map((e) => (
                <MyEventCard key={e.id} event={e} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

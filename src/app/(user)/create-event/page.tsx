import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { requireUser } from '@/lib/session';
import { canCreateEvent } from '@/lib/moderation';
import { LIMITS } from '@/lib/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EventForm } from '@/components/events/EventForm';

export const metadata: Metadata = {
  title: 'Создать событие | ТамБуду',
};

export default async function CreateEventPage() {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;
  const limit = await canCreateEvent(userId);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-2">
        Создать событие
      </h1>

      {limit.isSubscriber ? (
        <p className="text-muted-foreground text-sm mb-6">
          Подписка активна, лимита нет
        </p>
      ) : (
        <p className="text-muted-foreground text-sm mb-6">
          У тебя {limit.currentCount} из {LIMITS.FREE_EVENTS_PER_MONTH}{' '}
          бесплатных публикаций в этом месяце
        </p>
      )}

      {!limit.canCreate && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            Лимит исчерпан, оформи подписку 149{'\u00a0'}₽/мес или подожди
            следующий месяц.{' '}
            <Link
              href="/profile"
              className="underline font-medium"
            >
              Перейти в профиль
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <EventForm disabled={!limit.canCreate} />
    </div>
  );
}

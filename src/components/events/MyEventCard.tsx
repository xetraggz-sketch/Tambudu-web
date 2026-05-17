'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Trash2, Megaphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { EventStatus, EventCategory } from '@/generated/prisma/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { CATEGORIES } from '@/lib/categories';
import { formatDayMonth, formatTime } from '@/lib/format-date';
import { formatRubles } from '@/lib/format';
import { PRICES } from '@/lib/constants';
import {
  deleteEventAction,
  promoteEventAction,
} from '@/app/(user)/my-events/actions';

type MyEventData = {
  id: string;
  title: string;
  category: EventCategory;
  startsAt: Date | string;
  status: EventStatus;
  rejectionReason: string | null;
  promotedUntil: Date | string | null;
  _count: { registrations: number };
};

const STATUS_LABELS: Record<EventStatus, { text: string; className: string }> = {
  PENDING: { text: 'На модерации', className: 'tb-badge tb-badge-summer' },
  APPROVED: { text: 'Опубликовано', className: 'tb-badge tb-badge-olive' },
  REJECTED: { text: 'Отклонено', className: 'tb-badge bg-destructive text-destructive-foreground' },
};

export function MyEventCard({ event }: { event: MyEventData }) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);

  const start = event.startsAt instanceof Date ? event.startsAt : new Date(event.startsAt);
  const { day, month } = formatDayMonth(start);
  const time = formatTime(start);
  const cat = CATEGORIES[event.category] ?? { label: event.category, emoji: '✨' };
  const statusInfo = STATUS_LABELS[event.status];

  const promotedUntilDate = event.promotedUntil
    ? event.promotedUntil instanceof Date
      ? event.promotedUntil
      : new Date(event.promotedUntil)
    : null;
  const isPromoted = !!promotedUntilDate && promotedUntilDate > new Date();
  const isPast = start <= new Date();

  function handleDelete() {
    if (!confirm('Удалить это событие?')) return;
    startTransition(async () => {
      const result = await deleteEventAction(event.id);
      if (result.ok) {
        setDeleted(true);
        toast.success('Событие удалено');
      } else {
        toast.error(result.error ?? 'Ошибка при удалении');
      }
    });
  }

  function handlePromote() {
    startTransition(async () => {
      const result = await promoteEventAction(event.id);
      setPromoteOpen(false);
      if (result.ok) {
        toast.success('Событие продвинуто!');
      } else {
        toast.error(result.error ?? 'Ошибка при продвижении');
      }
    });
  }

  if (deleted) return null;

  const canDelete =
    event.status === 'PENDING' ||
    event.status === 'REJECTED' ||
    (event.status === 'APPROVED' && event._count.registrations === 0);

  const promoteLabel = isPromoted
    ? `Продлить ещё на 7 дней за ${formatRubles(PRICES.PROMOTION_KOPECKS)}`
    : `Продвинуть за ${formatRubles(PRICES.PROMOTION_KOPECKS)}`;

  return (
    <div className="tb-card p-4" data-slot="my-event-card">
      <div className="flex items-start gap-3">
        <div className="date-block shrink-0">
          <span className="day">{day}</span>
          <span className="month">{month}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={statusInfo.className}>{statusInfo.text}</span>
            {isPromoted && (
              <span className="tb-badge tb-badge-summer">
                Продвинуто до{' '}
                {format(promotedUntilDate!, 'dd.MM HH:mm', { locale: ru })}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {cat.emoji} {cat.label}
            </span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {time}
            </span>
          </div>

          <Link
            href={`/events/${event.id}`}
            className="font-display font-semibold leading-tight hover:underline line-clamp-1"
          >
            {event.title}
          </Link>

          {event.status === 'REJECTED' && event.rejectionReason && (
            <p className="text-destructive text-sm mt-1">
              Причина: {event.rejectionReason}
            </p>
          )}

          {event.status === 'APPROVED' && (
            <p className="text-muted-foreground text-xs mt-1">
              Регистраций: {event._count.registrations}
            </p>
          )}
        </div>

        <div className="flex gap-1.5 shrink-0">
          {event.status === 'APPROVED' && !isPast && (
            <AlertDialog open={promoteOpen} onOpenChange={setPromoteOpen}>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    aria-label="Продвинуть"
                  />
                }
              >
                {isPending ? (
                  <Loader2 className="animate-spin size-4" />
                ) : (
                  <Megaphone className="size-4" />
                )}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{promoteLabel}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Событие станет рекомендуемым на 7 дней и будет показываться
                    выше в ленте.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePromote} disabled={isPending}>
                    {isPending && <Loader2 className="animate-spin size-4 mr-1.5" />}
                    Подтвердить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
              aria-label="Удалить событие"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

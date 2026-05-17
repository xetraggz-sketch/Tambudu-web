'use client';

import Link from 'next/link';
import type { EventCategory } from '@/generated/prisma/client';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/categories';
import { formatDayMonth, formatTime, formatPrice } from '@/lib/format-date';

export type EventCardData = {
  id: string;
  title: string;
  category: EventCategory;
  startsAt: Date | string;
  address: string;
  priceKopecks: number;
  capacity?: number | null;
  registrationsCount: number;
  isPromoted: boolean;
  author: { id: string; name: string | null; avatarEmoji: string; hasAvatarImage?: boolean };
};

export function EventCard({
  event,
  selected = false,
}: {
  event: EventCardData;
  selected?: boolean;
}) {
  const start = event.startsAt instanceof Date ? event.startsAt : new Date(event.startsAt);
  const { day, month } = formatDayMonth(start);
  const time = formatTime(start);
  const cat = CATEGORIES[event.category] ?? { label: event.category, emoji: '✨' };

  return (
    <Link
      href={`/events/${event.id}`}
      data-slot="event-card"
      data-selected={selected}
      className={cn(
        'block tb-card p-4 relative',
        event.isPromoted && 'promoted-card',
      )}
    >
      {event.isPromoted && (
        <span className="tb-badge tb-badge-coal absolute top-3 right-3">
          ★ Рекомендуем
        </span>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className="date-block">
          <span className="day">{day}</span>
          <span className="month">{month}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-sm text-muted-foreground tabular">{time}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{event.address}</span>
        </div>
        <div className="ml-auto flex flex-col items-center gap-1">
          <span className="text-2xl leading-none">{cat.emoji}</span>
          <span className="tb-badge tb-badge-summer">{cat.label}</span>
        </div>
      </div>

      <h3 className={cn(
        'font-display text-lg font-semibold leading-tight line-clamp-2',
        event.isPromoted && 'font-bold',
      )}>
        {event.title}
      </h3>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
        <div>
          {event.priceKopecks === 0 ? (
            <span className="tb-badge tb-badge-olive">Бесплатно</span>
          ) : (
            <span className="font-display font-semibold">{formatPrice(event.priceKopecks)}</span>
          )}
        </div>
        <span className="font-mono text-muted-foreground tabular">
          {event.capacity != null
            ? `${event.registrationsCount} / ${event.capacity}`
            : `Записалось ${event.registrationsCount}`}
        </span>
      </div>
    </Link>
  );
}

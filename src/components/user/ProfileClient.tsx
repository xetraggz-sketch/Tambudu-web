'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import {
  Loader2,
  Pencil,
  CreditCard,
  Crown,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { AvatarPicker } from '@/components/user/AvatarPicker';
import { formatRubles } from '@/lib/format';
import { formatDayMonth, formatTime } from '@/lib/format-date';
import { PRICES } from '@/lib/constants';
import { CATEGORIES } from '@/lib/categories';
import type { EventCategory } from '@/generated/prisma/client';
import {
  updateProfileAction,
  subscribeAction,
} from '@/app/profile/actions';
import { deleteEventAction } from '@/app/(user)/my-events/actions';
import { cancelRegistrationAction } from '@/app/events/[id]/actions';

type EventMini = {
  id: string;
  title: string;
  category: string;
  startsAt: string;
  status?: string;
  _count?: { registrations: number };
};

type RegistrationWithEvent = {
  id: string;
  eventId: string;
  priceKopecksPaid: number;
  event: EventMini;
};

type TransactionRow = {
  id: string;
  deltaKopecks: number;
  type: string;
  meta: Record<string, string | number | boolean> | null;
  createdAt: string;
};

type ProfileData = {
  id: string;
  name: string | null;
  email: string;
  avatarEmoji: string;
  hasAvatarImage: boolean;
  balanceKopecks: number;
  subscriptionUntil: string | null;
  upcomingRegistrations: RegistrationWithEvent[];
  pastRegistrations: RegistrationWithEvent[];
  myEvents: EventMini[];
  transactions: TransactionRow[];
  reviewedEventIds: string[];
};

const TX_TYPE_LABELS: Record<string, string> = {
  TOPUP: 'Пополнение',
  EVENT_FEE: 'Запись на событие',
  PROMOTION: 'Продвижение',
  SUBSCRIPTION: 'Подписка',
  REFUND: 'Возврат',
};

function formatDateTime(iso: string) {
  return format(new Date(iso), 'd MMM yyyy, HH:mm', { locale: ru });
}

export function ProfileClient({ data }: { data: ProfileData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameValue, setNameValue] = useState(data.name ?? '');
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);

  const isSubscribed =
    !!data.subscriptionUntil && new Date(data.subscriptionUntil) > new Date();

  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'admin@tambudu.ru';

  function handleNameSave() {
    startTransition(async () => {
      const result = await updateProfileAction({ name: nameValue });
      if (result.ok) {
        toast.success('Имя обновлено');
        setNameDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  function handleSubscribe() {
    startTransition(async () => {
      const result = await subscribeAction();
      if (result.ok) {
        toast.success('Подписка оформлена!');
        router.refresh();
      } else {
        if ('available' in result && 'required' in result) {
          toast.error(
            `Не хватает средств. Текущий: ${formatRubles(result.available as number)}`,
          );
        } else {
          toast.error(result.error ?? 'Ошибка');
        }
      }
    });
  }

  function handleCancelRegistration(eventId: string) {
    startTransition(async () => {
      const result = await cancelRegistrationAction(eventId);
      if (result.ok) {
        toast.success('Запись отменена');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  function handleDeleteEvent(eventId: string) {
    if (!confirm('Удалить это событие?')) return;
    startTransition(async () => {
      const result = await deleteEventAction(eventId);
      if (result.ok) {
        toast.success('Событие удалено');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="tb-card p-5">
        <div className="flex items-center gap-4">
          <AvatarPicker user={data} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold truncate">
                {data.name ?? 'Без имени'}
              </h1>
              <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
                <DialogTrigger
                  render={
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Изменить имя"
                    />
                  }
                >
                  <Pencil className="size-4" />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Изменить имя</DialogTitle>
                  </DialogHeader>
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Ваше имя"
                    maxLength={50}
                  />
                  <div className="flex gap-2 justify-end mt-2">
                    <DialogClose render={<Button variant="outline" />}>
                      Отмена
                    </DialogClose>
                    <Button
                      onClick={handleNameSave}
                      disabled={isPending || nameValue.length < 2}
                    >
                      {isPending && (
                        <Loader2 className="animate-spin size-4 mr-1.5" />
                      )}
                      Сохранить
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {data.email}
            </p>
            <p className="text-sm text-muted-foreground">Самара</p>
          </div>
        </div>
      </div>

      {/* Balance + Subscription cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Balance */}
        <div className="tb-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Баланс
            </span>
          </div>
          <p className="font-display text-3xl font-bold tabular-nums">
            {formatRubles(data.balanceKopecks)}
          </p>
          <Dialog open={topupDialogOpen} onOpenChange={setTopupDialogOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" className="mt-3" />}>
              Пополнить
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Пополнение баланса</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Чтобы пополнить баланс, обратись к админу:{' '}
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-foreground underline underline-offset-2"
                >
                  {supportEmail}
                </a>
                . На MVP оплата не интегрирована.
              </p>
              <DialogClose render={<Button variant="outline" className="mt-2" />}>
                Понятно
              </DialogClose>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subscription */}
        <div className="tb-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Подписка
            </span>
          </div>
          {isSubscribed ? (
            <>
              <p className="font-display text-lg font-bold text-[color:var(--color-olive)]">
                Активна до{' '}
                {format(new Date(data.subscriptionUntil!), 'dd.MM.yyyy', {
                  locale: ru,
                })}
              </p>
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button size="sm" className="mt-3" />}
                >
                  Продлить на 30 дней за{' '}
                  {formatRubles(PRICES.SUBSCRIPTION_KOPECKS)}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Продлить подписку?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Списать {formatRubles(PRICES.SUBSCRIPTION_KOPECKS)} с
                      баланса?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                      Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSubscribe}
                      disabled={isPending}
                    >
                      {isPending && (
                        <Loader2 className="animate-spin size-4 mr-1.5" />
                      )}
                      Продлить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">Нет подписки</p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>Безлимит публикаций</li>
                <li>Продвижение событий</li>
                <li>5% скидка на платные события</li>
              </ul>
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button size="sm" className="mt-3" />}
                >
                  Оформить подписку{' '}
                  {formatRubles(PRICES.SUBSCRIPTION_KOPECKS)}/мес
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Оформить подписку?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Списать {formatRubles(PRICES.SUBSCRIPTION_KOPECKS)} с
                      баланса?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                      Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSubscribe}
                      disabled={isPending}
                    >
                      {isPending && (
                        <Loader2 className="animate-spin size-4 mr-1.5" />
                      )}
                      Оформить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming">
            Я записан на ({data.upcomingRegistrations.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Прошедшие ({data.pastRegistrations.length})
          </TabsTrigger>
          <TabsTrigger value="my-events">
            Мои события ({data.myEvents.length})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            Транзакции
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {data.upcomingRegistrations.length === 0 ? (
            <div className="tb-card p-6 text-center">
              <p className="text-muted-foreground mb-3">
                Ты пока никуда не записался
              </p>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Перейти к ленте
                </Button>
              </Link>
            </div>
          ) : (
            data.upcomingRegistrations.map((reg) => (
              <EventRegCard
                key={reg.id}
                reg={reg}
                onCancel={() => handleCancelRegistration(reg.eventId)}
                isPending={isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          {data.pastRegistrations.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              Нет прошедших событий
            </p>
          ) : (
            data.pastRegistrations.map((reg) => (
              <EventRegCard
                key={reg.id}
                reg={reg}
                isPast
                isPending={isPending}
                hasReview={data.reviewedEventIds.includes(reg.eventId)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="my-events" className="mt-4 space-y-3">
          {data.myEvents.length === 0 ? (
            <div className="tb-card p-6 text-center">
              <p className="text-muted-foreground mb-3">
                У вас пока нет событий
              </p>
              <Link href="/create-event">
                <Button variant="outline" size="sm">
                  Создать событие
                </Button>
              </Link>
            </div>
          ) : (
            data.myEvents.map((ev) => (
              <MyEventMiniCard
                key={ev.id}
                event={ev}
                onDelete={() => handleDeleteEvent(ev.id)}
                isPending={isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          {data.transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              Нет транзакций
            </p>
          ) : (
            <div className="tb-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Дата</th>
                    <th className="p-3 font-medium">Тип</th>
                    <th className="p-3 font-medium text-right">Сумма</th>
                    <th className="p-3 font-medium hidden sm:table-cell">
                      Описание
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border last:border-0">
                      <td className="p-3 whitespace-nowrap font-mono text-xs tabular-nums">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="p-3">
                        {TX_TYPE_LABELS[tx.type] ?? tx.type}
                      </td>
                      <td
                        className={`p-3 text-right font-mono tabular-nums whitespace-nowrap ${
                          tx.deltaKopecks > 0
                            ? 'text-[color:var(--color-olive)]'
                            : 'text-destructive'
                        }`}
                      >
                        {tx.deltaKopecks > 0 ? '+' : ''}
                        {formatRubles(Math.abs(tx.deltaKopecks))}
                      </td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">
                        {tx.meta?.description
                          ? String(tx.meta.description)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventRegCard({
  reg,
  onCancel,
  isPast,
  isPending,
  hasReview,
}: {
  reg: RegistrationWithEvent;
  onCancel?: () => void;
  isPast?: boolean;
  isPending: boolean;
  hasReview?: boolean;
}) {
  const start = new Date(reg.event.startsAt);
  const { day, month } = formatDayMonth(start);
  const time = formatTime(start);
  const cat = CATEGORIES[reg.event.category as EventCategory] ?? { label: reg.event.category, emoji: '✨' };

  return (
    <div className="tb-card p-4">
      <div className="flex items-start gap-3">
        <div className="date-block shrink-0">
          <span className="day">{day}</span>
          <span className="month">{month}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-muted-foreground">
              {cat.emoji} {cat.label}
            </span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {time}
            </span>
          </div>
          <Link
            href={`/events/${reg.event.id}`}
            className="font-display font-semibold leading-tight hover:underline line-clamp-1"
          >
            {reg.event.title}
          </Link>
        </div>
        {!isPast && onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
            className="shrink-0"
          >
            Отменить
          </Button>
        )}
        {isPast && !hasReview && (
          <Link href={`/events/${reg.event.id}#review-form`}>
            <Button variant="outline" size="sm">
              Отзыв
            </Button>
          </Link>
        )}
        {isPast && hasReview && (
          <span className="text-xs text-muted-foreground shrink-0">
            Отзыв оставлен
          </span>
        )}
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'На модерации', cls: 'tb-badge tb-badge-summer' },
  APPROVED: { text: 'Опубликовано', cls: 'tb-badge tb-badge-olive' },
  REJECTED: {
    text: 'Отклонено',
    cls: 'tb-badge bg-destructive text-destructive-foreground',
  },
};

function MyEventMiniCard({
  event,
  onDelete,
  isPending,
}: {
  event: EventMini;
  onDelete: () => void;
  isPending: boolean;
}) {
  const start = new Date(event.startsAt);
  const { day, month } = formatDayMonth(start);
  const time = formatTime(start);
  const cat = CATEGORIES[event.category as EventCategory] ?? { label: event.category, emoji: '✨' };
  const status = STATUS_LABELS[event.status ?? ''] ?? { text: event.status, cls: 'tb-badge' };

  const canDelete =
    event.status === 'PENDING' ||
    event.status === 'REJECTED' ||
    (event.status === 'APPROVED' && (event._count?.registrations ?? 0) === 0);

  return (
    <div className="tb-card p-4">
      <div className="flex items-start gap-3">
        <div className="date-block shrink-0">
          <span className="day">{day}</span>
          <span className="month">{month}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={status.cls}>{status.text}</span>
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
        </div>
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isPending}
            aria-label="Удалить событие"
            className="shrink-0"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

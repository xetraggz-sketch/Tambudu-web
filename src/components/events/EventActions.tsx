'use client';

import { useCallback, useState, useTransition } from 'react';
import Link from 'next/link';
import { Share2, Loader2 } from 'lucide-react';
import { ReportDialog } from '@/components/events/ReportDialog';
import { toast } from 'sonner';
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
import { formatPrice } from '@/lib/format-date';
import { formatRubles } from '@/lib/format';
import { PRICES } from '@/lib/constants';
import {
  registerAction,
  cancelRegistrationAction,
} from '@/app/events/[id]/actions';

export type EventActionsProps = {
  event: {
    id: string;
    priceKopecks: number;
    capacity: number | null;
    registrationsCount: number;
    startsAt: Date | string;
    authorId: string;
  };
  userId?: string;
  isSubscriber: boolean;
  isPast: boolean;
  userRegistration?: {
    status: 'ACTIVE' | 'CANCELLED';
    priceKopecksPaid: number;
  } | null;
  hoursUntilStart?: number;
};

export function EventActions({
  event,
  userId,
  isSubscriber: subscriber,
  isPast,
  userRegistration,
  hoursUntilStart,
}: EventActionsProps) {
  const remaining =
    event.capacity != null ? event.capacity - event.registrationsCount : null;
  const isAuthor = userId === event.authorId;
  const isRegistered = userRegistration?.status === 'ACTIVE';

  const subscriberPrice =
    event.priceKopecks > 0
      ? Math.floor(
          event.priceKopecks * (1 - PRICES.SUBSCRIBER_DISCOUNT_PERCENT / 100),
        )
      : 0;

  const effectivePrice = subscriber ? subscriberPrice : event.priceKopecks;
  const canRefund =
    (hoursUntilStart ?? 0) >= 24 &&
    (userRegistration?.priceKopecksPaid ?? 0) > 0;

  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  function handleRegister() {
    startTransition(async () => {
      const result = await registerAction(event.id);
      setConfirmOpen(false);
      if (result.ok) {
        toast.success('Вы записались на событие');
        return;
      }
      if (result.errorType === 'balance') {
        toast.error(
          `Недостаточно средств. Баланс: ${formatRubles(result.available ?? 0)}. Нужно: ${formatRubles(result.required ?? 0)}`,
        );
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelRegistrationAction(event.id);
      setCancelOpen(false);
      if (result.ok) {
        if (result.refunded && result.refunded > 0) {
          toast.success(
            `Запись отменена. Возврат: ${formatRubles(result.refunded)}`,
          );
        } else {
          toast.success('Запись отменена');
        }
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, []);

  function renderActionButton() {
    if (isPast) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Завершено
        </Button>
      );
    }

    if (!userId) {
      return (
        <Button
          className="w-full"
          nativeButton={false}
          render={
            <Link href={`/login?callbackUrl=/events/${event.id}`} />
          }
        >
          Войти, чтобы записаться
        </Button>
      );
    }

    if (isAuthor) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Это ваше событие
        </Button>
      );
    }

    if (isRegistered) {
      return (
        <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <AlertDialogTrigger
            render={
              <Button variant="outline" className="w-full" disabled={isPending} />
            }
          >
            {isPending ? (
              <Loader2 className="animate-spin size-4 mr-1.5" />
            ) : null}
            Отменить запись
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Отменить запись?</AlertDialogTitle>
              <AlertDialogDescription>
                {canRefund
                  ? `Возврат: ${formatRubles(userRegistration?.priceKopecksPaid ?? 0)}`
                  : userRegistration?.priceKopecksPaid
                    ? 'Возврат невозможен (менее 24 часов до начала)'
                    : 'Вы будете удалены из списка участников'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                Назад
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={isPending}
                variant="destructive"
              >
                {isPending && <Loader2 className="animate-spin size-4 mr-1.5" />}
                Отменить запись
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    if (remaining === 0) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Мест нет
        </Button>
      );
    }

    if (event.priceKopecks > 0) {
      return (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger
            render={
              <Button className="w-full" disabled={isPending} />
            }
          >
            {isPending ? (
              <Loader2 className="animate-spin size-4 mr-1.5" />
            ) : null}
            Записаться
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Списать {formatRubles(effectivePrice)} с баланса?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {subscriber && subscriberPrice !== event.priceKopecks
                  ? `Скидка подписчика 5%. Обычная цена: ${formatRubles(event.priceKopecks)}`
                  : 'Сумма будет списана с вашего баланса'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRegister}
                disabled={isPending}
              >
                {isPending && <Loader2 className="animate-spin size-4 mr-1.5" />}
                Оплатить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <Button
        className="w-full"
        disabled={isPending}
        onClick={handleRegister}
      >
        {isPending && <Loader2 className="animate-spin size-4 mr-1.5" />}
        Записаться
      </Button>
    );
  }

  return (
    <div className="tb-card p-4 space-y-4" data-slot="event-actions">
      <div>
        {event.priceKopecks === 0 ? (
          <span className="tb-badge tb-badge-olive text-base">Бесплатно</span>
        ) : (
          <div>
            <span className="font-display text-2xl font-bold">
              {formatPrice(event.priceKopecks)}
            </span>
            {subscriber && subscriberPrice !== event.priceKopecks && (
              <span className="text-sm text-muted-foreground ml-2">
                для подписчиков {formatPrice(subscriberPrice)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {event.capacity != null ? (
          <>
            <div className="flex justify-between mb-1">
              <span>
                {event.registrationsCount} из {event.capacity}
              </span>
              {remaining != null && remaining > 0 && (
                <span>осталось {remaining}</span>
              )}
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (event.registrationsCount / event.capacity) * 100)}%`,
                  background: 'var(--color-summer)',
                }}
              />
            </div>
          </>
        ) : (
          <span>Записалось {event.registrationsCount}</span>
        )}
      </div>

      <div className="space-y-2">{renderActionButton()}</div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          aria-label="Поделиться"
          className="flex-1"
        >
          <Share2 className="size-4 mr-1.5" />
          Поделиться
        </Button>
        {userId && !isAuthor && (
          <ReportDialog eventId={event.id} />
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/user/UserAvatar';
import { CATEGORIES } from '@/lib/categories';
import { formatRubles } from '@/lib/format';
import { formatEventDate } from '@/lib/format';
import { approveEventAction, rejectEventAction } from '@/app/admin/actions';
import type { EventCategory } from '@/generated/prisma/client';

type ModerationEvent = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string | null;
  address: string;
  lat: number;
  lng: number;
  priceKopecks: number;
  capacity: number | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarEmoji: string;
  };
};

export function ModerationList({ event }: { event: ModerationEvent }) {
  const [isPending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const cat = CATEGORIES[event.category] ?? { label: event.category, emoji: '✨' };

  function handleApprove() {
    startTransition(async () => {
      const result = await approveEventAction(event.id);
      if (result.ok) {
        setHidden(true);
        toast.success('Одобрено');
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  function handleReject() {
    if (reason.length < 3) return;
    startTransition(async () => {
      const result = await rejectEventAction(event.id, reason);
      if (result.ok) {
        setRejectOpen(false);
        setHidden(true);
        toast.success('Отклонено');
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  if (hidden) return null;

  return (
    <div className="tb-card p-4" data-slot="moderation-card">
      <div className="flex items-start gap-3 mb-3">
        <UserAvatar
          user={{
            id: event.author.id,
            name: event.author.name,
            avatarEmoji: event.author.avatarEmoji,
          }}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{event.author.name ?? event.author.email}</p>
          <p className="text-xs text-muted-foreground">{event.author.email}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatEventDate(new Date(event.createdAt))}
        </span>
      </div>

      <h3 className="font-display font-semibold text-lg mb-1">{event.title}</h3>

      <div className="flex flex-wrap gap-2 mb-2 text-xs text-muted-foreground">
        <span>{cat.emoji} {cat.label}</span>
        <span>{formatEventDate(new Date(event.startsAt))}</span>
        <span>{event.address}</span>
        {event.priceKopecks > 0 && <span>{formatRubles(event.priceKopecks)}</span>}
        {event.capacity && <span>Мест: {event.capacity}</span>}
        <span>Координаты: {event.lat.toFixed(4)}, {event.lng.toFixed(4)}</span>
      </div>

      <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4 line-clamp-4">
        {event.description}
      </p>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={isPending}
          className="bg-[color:var(--color-olive)] hover:bg-[color:var(--color-olive)]/90 text-white"
          aria-label="Одобрить"
        >
          {isPending ? (
            <Loader2 className="animate-spin size-4 mr-1.5" />
          ) : (
            <Check className="size-4 mr-1.5" />
          )}
          Одобрить
        </Button>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger
            render={
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                className="border-destructive text-destructive hover:bg-destructive/10"
                aria-label="Отклонить"
              />
            }
          >
            <X className="size-4 mr-1.5" />
            Отклонить
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Отклонить событие</DialogTitle>
              <DialogDescription>
                Укажите причину отклонения. Автор увидит её в разделе «Мои события».
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="reject-reason">Причина</Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Минимум 3 символа..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isPending || reason.length < 3}
              >
                {isPending && <Loader2 className="animate-spin size-4 mr-1.5" />}
                Отклонить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

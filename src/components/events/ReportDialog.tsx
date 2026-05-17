'use client';

import { useState, useTransition } from 'react';
import { Flag, Loader2 } from 'lucide-react';
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
import { reportEventAction } from '@/app/events/[id]/actions';
import { REASON_LABELS, type ReasonType } from '@/lib/report-reasons';

const REASON_OPTIONS = Object.entries(REASON_LABELS) as [ReasonType, string][];

export function ReportDialog({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reasonType, setReasonType] = useState<ReasonType | ''>('');
  const [comment, setComment] = useState('');

  const isOther = reasonType === 'OTHER';
  const canSubmit =
    reasonType !== '' && (!isOther || comment.trim().length > 0);

  function handleSubmit() {
    if (!canSubmit || !reasonType) return;
    startTransition(async () => {
      const result = await reportEventAction({
        eventId,
        reasonType,
        comment: comment.trim() || undefined,
      });
      if (result.ok) {
        toast.success('Жалоба отправлена, спасибо');
        setOpen(false);
        setReasonType('');
        setComment('');
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label="Пожаловаться"
            className="flex-1"
          />
        }
      >
        <Flag className="size-4 mr-1.5" />
        Пожаловаться
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пожаловаться на событие</DialogTitle>
          <DialogDescription>
            Выберите причину жалобы. Модератор рассмотрит в ближайшее время.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-2" disabled={isPending}>
          <Label>Причина</Label>
          {REASON_OPTIONS.map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="radio"
                name="reason"
                value={value}
                checked={reasonType === value}
                onChange={() => setReasonType(value)}
                className="accent-[var(--color-summer)]"
              />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="space-y-1">
          <Label htmlFor="report-comment">
            Уточнение{isOther ? '' : ' (необязательно)'}
          </Label>
          <Textarea
            id="report-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              isOther ? 'Опишите причину...' : 'Дополнительные детали...'
            }
            rows={3}
            maxLength={2000}
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !canSubmit}
          >
            {isPending && <Loader2 className="animate-spin size-4 mr-1.5" />}
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

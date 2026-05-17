'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Stars } from '@/components/events/Stars';
import { submitReviewAction } from '@/app/events/[id]/actions';

type ReviewFormProps = {
  eventId: string;
};

export function ReviewForm({ eventId }: ReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  function handleSubmit() {
    if (rating < 1) {
      toast.error('Поставьте оценку');
      return;
    }
    startTransition(async () => {
      const result = await submitReviewAction({
        eventId,
        rating,
        text: text.trim() || undefined,
      });
      if (result.ok) {
        toast.success('Отзыв отправлен!');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  return (
    <div id="review-form" className="space-y-3">
      <h3 className="font-display text-base font-semibold">Оставить отзыв</h3>
      <div>
        <Stars value={rating} onChange={setRating} size={28} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Расскажите о впечатлениях (необязательно)"
        maxLength={2000}
        rows={3}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {text.length}/2000
        </span>
        <Button
          onClick={handleSubmit}
          disabled={isPending || rating < 1}
          size="sm"
        >
          {isPending && <Loader2 className="animate-spin size-4 mr-1.5" />}
          Оставить отзыв
        </Button>
      </div>
    </div>
  );
}

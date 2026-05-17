'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatRelative } from '@/lib/format';
import { closeReportAction, deleteEventByReportAction } from '@/app/admin/actions';
import type { EventStatus } from '@/generated/prisma/client';

type ReportData = {
  id: string;
  reason: string;
  createdAt: string;
  event: { id: string; title: string; status: EventStatus };
  user: { id: string; name: string | null; email: string };
};

export function ReportList({ report }: { report: ReportData }) {
  const [isPending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  function handleClose() {
    startTransition(async () => {
      const result = await closeReportAction(report.id);
      if (result.ok) {
        setHidden(true);
        toast.success('Жалоба закрыта');
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteEventByReportAction(report.id);
      if (result.ok) {
        setHidden(true);
        toast.success('Событие удалено, жалобы закрыты');
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  if (hidden) return null;

  return (
    <div className="tb-card p-4" data-slot="report-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <Link
            href={`/events/${report.event.id}`}
            className="font-display font-semibold hover:underline"
          >
            {report.event.title}
          </Link>
          <p className="text-xs text-muted-foreground">
            Пожаловался: {report.user.name ?? report.user.email} ({report.user.email})
          </p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatRelative(new Date(report.createdAt))}
        </span>
      </div>

      <p className="text-sm mb-4 whitespace-pre-wrap">{report.reason}</p>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleClose}
          disabled={isPending}
          aria-label="Закрыть жалобу"
        >
          {isPending ? (
            <Loader2 className="animate-spin size-4 mr-1.5" />
          ) : (
            <XCircle className="size-4 mr-1.5" />
          )}
          Закрыть жалобу
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Удалить событие"
        >
          {isPending ? (
            <Loader2 className="animate-spin size-4 mr-1.5" />
          ) : (
            <Trash2 className="size-4 mr-1.5" />
          )}
          Удалить событие
        </Button>
      </div>
    </div>
  );
}

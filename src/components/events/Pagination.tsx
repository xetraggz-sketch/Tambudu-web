'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';

export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();

  function href(p: number) {
    const sp = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      sp.delete('page');
    } else {
      sp.set('page', String(p));
    }
    const qs = sp.toString();
    return qs ? `/?${qs}` : '/';
  }

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-6"
      aria-label="Навигация по страницам"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <ChevronLeft className="size-4 mr-1" />
          Назад
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="size-4 mr-1" />
          Назад
        </Button>
      )}

      <span className="font-mono text-sm text-muted-foreground tabular px-2">
        {page} из {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          Вперёд
          <ChevronRight className="size-4 ml-1" />
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Вперёд
          <ChevronRight className="size-4 ml-1" />
        </Button>
      )}
    </nav>
  );
}

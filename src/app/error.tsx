'use client';

import { Button } from '@/components/ui/button';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-4xl font-bold">Что-то пошло не так</h1>
        <p className="text-muted-foreground text-lg">Произошла непредвиденная ошибка</p>
        <Button onClick={reset} className="rounded-lg">Перезагрузить</Button>
      </div>
    </div>
  );
}

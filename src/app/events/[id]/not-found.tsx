import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EventNotFound() {
  return (
    <div className="container mx-auto max-w-screen-xl px-4 py-16 text-center">
      <div className="text-5xl mb-4">🤷</div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">
        Событие не найдено
      </h1>
      <p className="text-muted-foreground mb-6">
        Возможно, оно было удалено или ещё не прошло модерацию.
      </p>
      <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
        Вернуться к ленте
      </Button>
    </div>
  );
}

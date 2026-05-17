import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-muted-foreground text-lg">Страница не найдена</p>
        <Link href="/" className={buttonVariants()}>
          На главную
        </Link>
      </div>
    </div>
  );
}

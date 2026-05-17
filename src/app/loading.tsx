import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-80" />
        <Skeleton className="h-5 w-72" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-40" />
        </div>
      </div>
    </div>
  );
}

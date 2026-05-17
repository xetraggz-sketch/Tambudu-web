import { Skeleton } from '@/components/ui/skeleton';

export function EventCardSkeleton() {
  return (
    <div className="tb-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-12 h-14 rounded-lg" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-full mb-1" />
      <Skeleton className="h-5 w-3/4" />
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

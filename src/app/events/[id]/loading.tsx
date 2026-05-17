import { Skeleton } from '@/components/ui/skeleton';

export default function EventLoading() {
  return (
    <div className="container mx-auto max-w-screen-xl px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-10 w-1/2" />
            <div className="flex items-center gap-3 mt-4">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="tb-card p-4 space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="tb-card p-4 space-y-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-[300px] md:h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export const EventsMapDynamic = dynamic(
  () => import('./EventsMap').then((m) => m.EventsMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full min-h-[400px] rounded-xl" />,
  },
);

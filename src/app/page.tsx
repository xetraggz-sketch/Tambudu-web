import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { EventCategory } from '@/generated/prisma/client';
import { getEventsFeed, type FeedParams } from '@/lib/feed';
import { FeedMapSplit } from '@/components/events/FeedMapSplit';
import { EventFilters } from '@/components/events/EventFilters';
import { Pagination } from '@/components/events/Pagination';
import { EventCardSkeleton } from '@/components/events/EventCardSkeleton';

export const metadata: Metadata = {
  title: 'События в Самаре | ТамБуду',
  description:
    'Афиша платных и бесплатных мероприятий в Самаре: лекции, мастер-классы, прогулки, музыка. Размещение и регистрация — бесплатно.',
  openGraph: {
    title: 'События в Самаре | ТамБуду',
    description:
      'Афиша платных и бесплатных мероприятий в Самаре: лекции, мастер-классы, прогулки, музыка.',
    images: ['/og-default.png'],
  },
  robots: { index: true, follow: true },
};

const VALID_CATEGORIES = new Set<string>([
  'LECTURE', 'WORKSHOP', 'SPORT', 'MUSIC', 'CINEMA',
  'EXHIBITION', 'WALK', 'MEETUP', 'PERFORMANCE', 'OTHER',
]);

function parseParams(
  sp: Record<string, string | string[] | undefined>,
): FeedParams {
  const q = typeof sp.q === 'string' ? sp.q.trim() : undefined;
  const categoryRaw = typeof sp.category === 'string' ? sp.category : undefined;
  const category = categoryRaw
    ? (categoryRaw.split(',').filter((c) => VALID_CATEGORIES.has(c)) as EventCategory[])
    : undefined;
  const date = (['today', 'tomorrow', 'week', 'all'] as const).includes(
    sp.date as 'today' | 'tomorrow' | 'week' | 'all',
  )
    ? (sp.date as 'today' | 'tomorrow' | 'week' | 'all')
    : 'all';
  const price = (['free', 'paid', 'all'] as const).includes(
    sp.price as 'free' | 'paid' | 'all',
  )
    ? (sp.price as 'free' | 'paid' | 'all')
    : 'all';
  const sort = (['soon', 'popular', 'new'] as const).includes(
    sp.sort as 'soon' | 'popular' | 'new',
  )
    ? (sp.sort as 'soon' | 'popular' | 'new')
    : 'soon';
  const page = Math.max(1, Number(sp.page) || 1);

  return { q: q || undefined, category, date, price, sort, page };
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

async function Feed({ params }: { params: FeedParams }) {
  const { items, total, page, totalPages } = await getEventsFeed(params);

  if (total > 0 && page > totalPages) {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.category?.length) sp.set('category', params.category.join(','));
    if (params.date && params.date !== 'all') sp.set('date', params.date);
    if (params.price && params.price !== 'all') sp.set('price', params.price);
    if (params.sort && params.sort !== 'soon') sp.set('sort', params.sort);
    sp.set('page', '1');
    redirect(`/?${sp.toString()}`);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: total,
    itemListElement: items.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: e.title,
        startDate: e.startsAt.toISOString(),
        location: {
          '@type': 'Place',
          name: e.address,
          geo: { '@type': 'GeoCoordinates', latitude: e.lat, longitude: e.lng },
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FeedMapSplit events={items} />
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} />
      )}
    </>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = parseParams(sp);

  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          События в Самаре
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Лекции, мастер-классы, прогулки, музыка. Бесплатные и платные.
          Без шумной рекламы — всё от местных жителей.
        </p>
      </header>

      <EventFilters initial={params} />

      <Suspense fallback={<FeedSkeleton />}>
        <Feed params={params} />
      </Suspense>
    </div>
  );
}

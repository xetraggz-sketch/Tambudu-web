import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { CATEGORIES } from '@/lib/categories';
import { formatEventDate, formatRelative } from '@/lib/format';
import { getEventReviews } from '@/lib/reviews';
import { UserAvatar } from '@/components/user/UserAvatar';
import { EventActions } from '@/components/events/EventActions';
import { EventsMapDynamic } from '@/components/map/EventsMapDynamic';
import { Stars } from '@/components/events/Stars';
import { ReviewForm } from '@/components/events/ReviewForm';

async function getEvent(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, avatarEmoji: true },
      },
      _count: {
        select: { registrations: { where: { status: 'ACTIVE' } } },
      },
    },
  });
  return event;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: 'Событие не найдено | ТамБуду' };

  const desc = event.description.slice(0, 160);
  return {
    title: `${event.title} | ТамБуду`,
    description: desc,
    openGraph: {
      title: `${event.title} | ТамБуду`,
      description: desc,
      type: 'article',
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const session = await getSession();
  const now = new Date();
  const userId = session?.user?.id;
  const isAuthor = userId === event.authorId;
  const isAdmin = session?.user?.role === 'ADMIN';

  if (event.status !== 'APPROVED') {
    if (!isAuthor && !isAdmin) notFound();
  }

  const isPast = event.startsAt < now;
  const hoursUntilStart = Math.max(
    0,
    (event.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60),
  );
  const isPromoted = event.promotedUntil != null && event.promotedUntil > now;

  const [userRegistration, reviewData, userReview] = await Promise.all([
    userId
      ? prisma.registration.findUnique({
          where: { userId_eventId: { userId, eventId: event.id } },
          select: { status: true, priceKopecksPaid: true },
        })
      : null,
    getEventReviews(event.id, 50),
    userId
      ? prisma.review.findUnique({
          where: { eventId_userId: { eventId: event.id, userId } },
          select: { id: true },
        })
      : null,
  ]);

  const hasActiveRegistration =
    userRegistration?.status === 'ACTIVE';
  const canReview =
    !!userId &&
    !isAuthor &&
    isPast &&
    hasActiveRegistration &&
    !userReview;

  const cat = CATEGORIES[event.category] ?? { label: event.category, emoji: '✨' };
  const hasValidCoords =
    !isNaN(event.lat) && !isNaN(event.lng) &&
    !(event.lat === 0 && event.lng === 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.startsAt.toISOString(),
    ...(event.endsAt ? { endDate: event.endsAt.toISOString() } : {}),
    location: {
      '@type': 'Place',
      name: event.address,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: event.lat,
        longitude: event.lng,
      },
    },
    ...(event.priceKopecks > 0
      ? {
          offers: {
            '@type': 'Offer',
            price: (event.priceKopecks / 100).toFixed(2),
            priceCurrency: 'RUB',
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto max-w-screen-xl px-4 py-8">
        {event.status === 'PENDING' && (
          <div className="tb-card p-4 mb-4 text-sm text-muted-foreground border-l-4" style={{ borderLeftColor: 'var(--color-summer)' }}>
            Это событие на модерации. Оно видно только вам.
          </div>
        )}
        {event.status === 'REJECTED' && (
          <div className="tb-card p-4 mb-4 text-sm border-l-4" style={{ borderLeftColor: 'var(--color-rust)' }}>
            <span className="font-semibold text-foreground">Событие отклонено.</span>
            {event.rejectionReason && (
              <span className="text-muted-foreground"> Причина: {event.rejectionReason}</span>
            )}
          </div>
        )}
        {isPast && (
          <div className="tb-card p-4 mb-4 text-sm text-muted-foreground">
            Событие завершилось.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <header>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl leading-none">{cat.emoji}</span>
                <span className="tb-badge tb-badge-summer">{cat.label}</span>
                {isPromoted && (
                  <span className="tb-badge tb-badge-coal ml-auto">★ Рекомендуем</span>
                )}
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {event.title}
              </h1>

              <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                <UserAvatar
                  user={{ ...event.author, hasAvatarImage: false }}
                  size="sm"
                />
                <span className="font-medium text-foreground">{event.author.name ?? 'Пользователь'}</span>
                <span>·</span>
                <time dateTime={event.startsAt.toISOString()}>
                  {formatEventDate(event.startsAt)}
                </time>
              </div>
            </header>

            <article className="whitespace-pre-wrap max-w-prose font-body leading-relaxed text-foreground">
              {event.description}
            </article>

            <section aria-label="Отзывы" className="tb-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Отзывы</h2>
                {reviewData.avgRating != null && (
                  <div className="flex items-center gap-2">
                    <Stars value={Math.round(reviewData.avgRating)} size={16} />
                    <span className="tb-badge tb-badge-summer">
                      {reviewData.avgRating} ({reviewData.totalCount})
                    </span>
                  </div>
                )}
              </div>

              {reviewData.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Отзывов пока нет.</p>
              ) : (
                <div className="space-y-3">
                  {reviewData.items.map((review) => (
                    <div key={review.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                      <div className="flex items-center gap-2 mb-1">
                        <UserAvatar
                          user={{ ...review.user, hasAvatarImage: false }}
                          size="sm"
                        />
                        <span className="text-sm font-medium">{review.user.name ?? 'Пользователь'}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelative(review.createdAt)}
                        </span>
                      </div>
                      <Stars value={review.rating} size={14} />
                      {review.text && (
                        <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                          {review.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {canReview && (
                <div className="border-t border-border pt-4">
                  <ReviewForm eventId={event.id} />
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <EventActions
              event={{
                id: event.id,
                priceKopecks: event.priceKopecks,
                capacity: event.capacity,
                registrationsCount: event._count.registrations,
                startsAt: event.startsAt,
                authorId: event.authorId,
              }}
              userId={userId}
              isSubscriber={
                !!session?.user?.subscriptionUntil &&
                new Date(session.user.subscriptionUntil) > now
              }
              isPast={isPast}
              userRegistration={
                userRegistration
                  ? {
                      status: userRegistration.status as 'ACTIVE' | 'CANCELLED',
                      priceKopecksPaid: userRegistration.priceKopecksPaid,
                    }
                  : null
              }
              hoursUntilStart={hoursUntilStart}
            />

            <div className="tb-card p-4 space-y-3">
              <h2 className="font-display text-base font-semibold">Место</h2>
              <p className="text-sm text-muted-foreground">{event.address}</p>
              {hasValidCoords ? (
                <div className="rounded-xl overflow-hidden h-[300px] md:h-[400px]">
                  <EventsMapDynamic
                    events={[{
                      id: event.id,
                      lat: event.lat,
                      lng: event.lng,
                      title: event.title,
                      category: event.category,
                      isPromoted: false,
                    }]}
                    center={{ lat: event.lat, lng: event.lng }}
                    zoom={15}
                  />
                </div>
              ) : (
                <div className="tb-card p-6 text-center text-muted-foreground">
                  Координаты не указаны
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

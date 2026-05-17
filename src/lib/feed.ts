import { prisma } from '@/lib/prisma';
import { DEFAULT_CITY } from '@/lib/constants';
import type { EventCategory, Prisma } from '@/generated/prisma/client';
import { startOfDay, addDays } from 'date-fns';

const PER_PAGE = 20;
const MAX_Q_LENGTH = 200;

export type DatePreset = 'today' | 'tomorrow' | 'week' | 'all';
export type PriceFilter = 'free' | 'paid' | 'all';
export type SortOption = 'soon' | 'popular' | 'new';

export interface FeedParams {
  q?: string;
  category?: EventCategory[];
  date?: DatePreset;
  price?: PriceFilter;
  sort?: SortOption;
  page?: number;
}

export interface FeedItem {
  id: string;
  title: string;
  category: EventCategory;
  startsAt: Date;
  address: string;
  lat: number;
  lng: number;
  priceKopecks: number;
  capacity: number | null;
  registrationsCount: number;
  isPromoted: boolean;
  author: { id: string; name: string | null; avatarEmoji: string };
}

export interface FeedResult {
  items: FeedItem[];
  total: number;
  page: number;
  totalPages: number;
}

function buildWhere(params: FeedParams): Prisma.EventWhereInput {
  const now = new Date();
  const where: Prisma.EventWhereInput = {
    status: 'APPROVED',
    city: DEFAULT_CITY,
  };

  const andClauses: Prisma.EventWhereInput[] = [];

  if (params.date === 'today') {
    const dayStart = startOfDay(now);
    const dayEnd = addDays(dayStart, 1);
    andClauses.push({ startsAt: { gte: dayStart, lt: dayEnd } });
  } else if (params.date === 'tomorrow') {
    const tomorrowStart = addDays(startOfDay(now), 1);
    const tomorrowEnd = addDays(tomorrowStart, 1);
    andClauses.push({ startsAt: { gte: tomorrowStart, lt: tomorrowEnd } });
  } else if (params.date === 'week') {
    const weekEnd = addDays(now, 7);
    andClauses.push({ startsAt: { gte: now, lte: weekEnd } });
  } else {
    andClauses.push({ startsAt: { gte: now } });
  }

  if (params.category && params.category.length > 0) {
    andClauses.push({ category: { in: params.category } });
  }

  if (params.price === 'free') {
    andClauses.push({ priceKopecks: 0 });
  } else if (params.price === 'paid') {
    andClauses.push({ priceKopecks: { gt: 0 } });
  }

  if (params.q) {
    const q = params.q.slice(0, MAX_Q_LENGTH);
    andClauses.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  return where;
}

function buildOrderBy(
  sort: SortOption = 'soon',
): Prisma.EventOrderByWithRelationInput[] {
  switch (sort) {
    case 'soon':
      return [
        { promotedUntil: { sort: 'desc', nulls: 'last' } },
        { startsAt: 'asc' },
      ];
    case 'popular':
      return [
        { promotedUntil: { sort: 'desc', nulls: 'last' } },
        { registrations: { _count: 'desc' } },
        { startsAt: 'asc' },
      ];
    case 'new':
      return [{ createdAt: 'desc' }];
  }
}

export async function getEventsFeed(params: FeedParams): Promise<FeedResult> {
  const page = Math.max(1, params.page ?? 1);
  const where = buildWhere(params);
  const orderBy = buildOrderBy(params.sort);

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        author: { select: { id: true, name: true, avatarEmoji: true } },
        _count: {
          select: { registrations: { where: { status: 'ACTIVE' } } },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const now = new Date();

  return {
    items: items.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      startsAt: e.startsAt,
      address: e.address,
      lat: e.lat,
      lng: e.lng,
      priceKopecks: e.priceKopecks,
      capacity: e.capacity,
      registrationsCount: e._count.registrations,
      isPromoted: e.promotedUntil != null && e.promotedUntil > now,
      author: e.author,
    })),
    total,
    page,
    totalPages,
  };
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addDays, addHours, startOfDay } from 'date-fns';

const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt-1',
    title: 'Тестовое событие',
    description: 'Описание',
    category: 'LECTURE',
    startsAt: addHours(new Date(), 5),
    address: 'ул. Тестовая, 1',
    lat: 53.2,
    lng: 50.15,
    priceKopecks: 0,
    capacity: null,
    status: 'APPROVED',
    city: 'Самара',
    promotedUntil: null,
    createdAt: new Date(),
    author: { id: 'u1', name: 'Тест', avatarEmoji: '😀' },
    _count: { registrations: 3 },
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCallWhere(): any {
  return mockFindMany.mock.calls[0]![0].where;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCallOrderBy(): any {
  return mockFindMany.mock.calls[0]![0].orderBy;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findAndClause(predicate: (c: Record<string, unknown>) => boolean): any {
  const where = getCallWhere();
  return where.AND.find(predicate);
}

describe('getEventsFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
  });

  async function callFeed(params = {}) {
    const { getEventsFeed } = await import('../feed');
    return getEventsFeed(params);
  }

  it('возвращает пустой результат при отсутствии событий', async () => {
    const result = await callFeed();
    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      totalPages: 1,
    });
    expect(mockFindMany).toHaveBeenCalledOnce();
    expect(mockCount).toHaveBeenCalledOnce();
  });

  it('маппит событие в FeedItem с isPromoted', async () => {
    const promoted = makeEvent({ promotedUntil: addDays(new Date(), 3) });
    mockFindMany.mockResolvedValue([promoted]);
    mockCount.mockResolvedValue(1);

    const result = await callFeed();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.isPromoted).toBe(true);
    expect(result.items[0]!.registrationsCount).toBe(3);
  });

  it('isPromoted = false для истёкшего promotedUntil', async () => {
    const expired = makeEvent({ promotedUntil: addDays(new Date(), -1) });
    mockFindMany.mockResolvedValue([expired]);
    mockCount.mockResolvedValue(1);

    const result = await callFeed();
    expect(result.items[0]!.isPromoted).toBe(false);
  });

  it('фильтрует по категории', async () => {
    await callFeed({ category: ['SPORT', 'MUSIC'] });

    const clause = findAndClause((c) => 'category' in c);
    expect(clause).toEqual({ category: { in: ['SPORT', 'MUSIC'] } });
  });

  it('фильтрует по date=today', async () => {
    await callFeed({ date: 'today' });

    const clause = findAndClause((c) => 'startsAt' in c);
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    expect(clause.startsAt.gte.getTime()).toBe(today.getTime());
    expect(clause.startsAt.lt.getTime()).toBe(tomorrow.getTime());
  });

  it('фильтрует по date=tomorrow', async () => {
    await callFeed({ date: 'tomorrow' });

    const clause = findAndClause((c) => 'startsAt' in c);
    const tomorrowStart = addDays(startOfDay(new Date()), 1);
    const tomorrowEnd = addDays(tomorrowStart, 1);
    expect(clause.startsAt.gte.getTime()).toBe(tomorrowStart.getTime());
    expect(clause.startsAt.lt.getTime()).toBe(tomorrowEnd.getTime());
  });

  it('фильтрует по date=week', async () => {
    await callFeed({ date: 'week' });

    const clause = findAndClause((c) => 'startsAt' in c);
    expect(clause.startsAt.gte).toBeDefined();
    expect(clause.startsAt.lte).toBeDefined();
  });

  it('фильтрует по price=free', async () => {
    await callFeed({ price: 'free' });

    const clause = findAndClause((c) => 'priceKopecks' in c);
    expect(clause).toEqual({ priceKopecks: 0 });
  });

  it('фильтрует по price=paid', async () => {
    await callFeed({ price: 'paid' });

    const clause = findAndClause((c) => 'priceKopecks' in c);
    expect(clause).toEqual({ priceKopecks: { gt: 0 } });
  });

  it('фильтрует по q (поиск)', async () => {
    await callFeed({ q: 'йога' });

    const clause = findAndClause((c) => 'OR' in c);
    expect(clause.OR).toHaveLength(2);
    expect(clause.OR[0]).toEqual({
      title: { contains: 'йога', mode: 'insensitive' },
    });
  });

  it('обрезает q длиннее 200 символов', async () => {
    const longQ = 'а'.repeat(250);
    await callFeed({ q: longQ });

    const clause = findAndClause((c) => 'OR' in c);
    expect(clause.OR[0].title.contains).toHaveLength(200);
  });

  it('пагинация: skip и take', async () => {
    mockCount.mockResolvedValue(50);
    mockFindMany.mockResolvedValue([]);

    const result = await callFeed({ page: 3 });

    const args = mockFindMany.mock.calls[0]![0];
    expect(args.skip).toBe(40);
    expect(args.take).toBe(20);
    expect(result.page).toBe(3);
    expect(result.totalPages).toBe(3);
  });

  it('page=0 нормализуется до 1', async () => {
    await callFeed({ page: 0 });

    const args = mockFindMany.mock.calls[0]![0];
    expect(args.skip).toBe(0);
  });

  it('сортировка sort=soon: promoted сверху, потом startsAt asc', async () => {
    await callFeed({ sort: 'soon' });

    const orderBy = getCallOrderBy();
    expect(orderBy[0]).toEqual({
      promotedUntil: { sort: 'desc', nulls: 'last' },
    });
    expect(orderBy[1]).toEqual({ startsAt: 'asc' });
  });

  it('сортировка sort=popular: promoted + _count desc', async () => {
    await callFeed({ sort: 'popular' });

    const orderBy = getCallOrderBy();
    expect(orderBy[0]).toEqual({
      promotedUntil: { sort: 'desc', nulls: 'last' },
    });
    expect(orderBy[1]).toEqual({ registrations: { _count: 'desc' } });
  });

  it('сортировка sort=new: createdAt desc', async () => {
    await callFeed({ sort: 'new' });

    const orderBy = getCallOrderBy();
    expect(orderBy[0]).toEqual({ createdAt: 'desc' });
  });
});

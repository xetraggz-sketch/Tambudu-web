import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEventFindUnique = vi.fn();
const mockRegFindUnique = vi.fn();
const mockReviewFindUnique = vi.fn();
const mockReviewCreate = vi.fn();
const mockReviewFindMany = vi.fn();
const mockReviewAggregate = vi.fn();
const mockReviewCount = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
    },
    registration: {
      findUnique: (...args: unknown[]) => mockRegFindUnique(...args),
    },
    review: {
      findUnique: (...args: unknown[]) => mockReviewFindUnique(...args),
      create: (...args: unknown[]) => mockReviewCreate(...args),
      findMany: (...args: unknown[]) => mockReviewFindMany(...args),
      aggregate: (...args: unknown[]) => mockReviewAggregate(...args),
      count: (...args: unknown[]) => mockReviewCount(...args),
    },
  },
}));

import {
  submitReview,
  getEventReviews,
  ReviewValidationError,
  DuplicateReviewError,
} from '@/lib/reviews';

const USER_ID = 'user-1';
const AUTHOR_ID = 'author-1';
const EVENT_ID = 'event-1';

function pastEvent(overrides = {}) {
  const past = new Date();
  past.setDate(past.getDate() - 1);
  return {
    authorId: AUTHOR_ID,
    status: 'APPROVED',
    startsAt: past,
    ...overrides,
  };
}

describe('submitReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventFindUnique.mockResolvedValue(pastEvent());
    mockRegFindUnique.mockResolvedValue({ status: 'ACTIVE' });
    mockReviewFindUnique.mockResolvedValue(null);
    mockReviewCreate.mockResolvedValue({ id: 'review-1', rating: 5 });
  });

  it('создаёт отзыв при валидных данных', async () => {
    await submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 5, text: 'Супер!' });

    expect(mockReviewCreate).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        eventId: EVENT_ID,
        rating: 5,
        text: 'Супер!',
      },
    });
  });

  it('запрещает автору оставлять отзыв на своё событие', async () => {
    await expect(
      submitReview({ userId: AUTHOR_ID, eventId: EVENT_ID, rating: 4 }),
    ).rejects.toThrow(ReviewValidationError);
    expect(mockReviewCreate).not.toHaveBeenCalled();
  });

  it('запрещает отзыв на неопубликованное событие', async () => {
    mockEventFindUnique.mockResolvedValue(pastEvent({ status: 'PENDING' }));

    await expect(
      submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 3 }),
    ).rejects.toThrow(ReviewValidationError);
    expect(mockReviewCreate).not.toHaveBeenCalled();
  });

  it('запрещает отзыв на будущее событие', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    mockEventFindUnique.mockResolvedValue(pastEvent({ startsAt: future }));

    await expect(
      submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 3 }),
    ).rejects.toThrow(ReviewValidationError);
    expect(mockReviewCreate).not.toHaveBeenCalled();
  });

  it('запрещает отзыв без ACTIVE регистрации', async () => {
    mockRegFindUnique.mockResolvedValue({ status: 'CANCELLED' });

    await expect(
      submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 4 }),
    ).rejects.toThrow(ReviewValidationError);
    expect(mockReviewCreate).not.toHaveBeenCalled();
  });

  it('запрещает отзыв без регистрации', async () => {
    mockRegFindUnique.mockResolvedValue(null);

    await expect(
      submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 4 }),
    ).rejects.toThrow(ReviewValidationError);
    expect(mockReviewCreate).not.toHaveBeenCalled();
  });

  it('запрещает дублирующий отзыв', async () => {
    mockReviewFindUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 5 }),
    ).rejects.toThrow(DuplicateReviewError);
    expect(mockReviewCreate).not.toHaveBeenCalled();
  });

  it('запрещает оценку вне диапазона 1..5', async () => {
    await expect(
      submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 0 }),
    ).rejects.toThrow(ReviewValidationError);

    await expect(
      submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 6 }),
    ).rejects.toThrow(ReviewValidationError);

    await expect(
      submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 3.5 }),
    ).rejects.toThrow(ReviewValidationError);

    expect(mockReviewCreate).not.toHaveBeenCalled();
  });

  it('запрещает текст длиннее 2000 символов', async () => {
    const longText = 'a'.repeat(2001);

    await expect(
      submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 4, text: longText }),
    ).rejects.toThrow(ReviewValidationError);
    expect(mockReviewCreate).not.toHaveBeenCalled();
  });

  it('сохраняет null при пустом тексте', async () => {
    await submitReview({ userId: USER_ID, eventId: EVENT_ID, rating: 3, text: '  ' });

    expect(mockReviewCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ text: null }),
    });
  });
});

describe('getEventReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает items, avgRating и totalCount', async () => {
    const items = [
      { id: 'r1', rating: 5, text: 'ok', createdAt: new Date(), user: { id: 'u1', name: 'A', avatarEmoji: '😀' } },
    ];
    mockReviewFindMany.mockResolvedValue(items);
    mockReviewAggregate.mockResolvedValue({ _avg: { rating: 4.5 } });
    mockReviewCount.mockResolvedValue(3);

    const result = await getEventReviews(EVENT_ID);

    expect(result.items).toEqual(items);
    expect(result.avgRating).toBe(4.5);
    expect(result.totalCount).toBe(3);
  });

  it('возвращает null avgRating когда нет отзывов', async () => {
    mockReviewFindMany.mockResolvedValue([]);
    mockReviewAggregate.mockResolvedValue({ _avg: { rating: null } });
    mockReviewCount.mockResolvedValue(0);

    const result = await getEventReviews(EVENT_ID);

    expect(result.avgRating).toBeNull();
    expect(result.totalCount).toBe(0);
  });
});

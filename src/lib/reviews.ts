import { prisma } from '@/lib/prisma';

export class ReviewValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewValidationError';
  }
}

export class DuplicateReviewError extends Error {
  constructor() {
    super('Вы уже оставляли отзыв на это событие');
    this.name = 'DuplicateReviewError';
  }
}

export async function submitReview({
  userId,
  eventId,
  rating,
  text,
}: {
  userId: string;
  eventId: string;
  rating: number;
  text?: string;
}) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ReviewValidationError('Оценка должна быть от 1 до 5');
  }

  if (text != null && text.length > 2000) {
    throw new ReviewValidationError('Текст отзыва не может быть длиннее 2000 символов');
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { authorId: true, status: true, startsAt: true },
  });

  if (!event) {
    throw new ReviewValidationError('Событие не найдено');
  }

  if (event.authorId === userId) {
    throw new ReviewValidationError('Нельзя оставить отзыв на своё событие');
  }

  if (event.status !== 'APPROVED') {
    throw new ReviewValidationError('Событие не опубликовано');
  }

  if (event.startsAt >= new Date()) {
    throw new ReviewValidationError('Нельзя оставить отзыв до начала события');
  }

  const registration = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { status: true },
  });

  if (!registration || registration.status !== 'ACTIVE') {
    throw new ReviewValidationError('Вы не записаны на это событие');
  }

  const existing = await prisma.review.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (existing) {
    throw new DuplicateReviewError();
  }

  return prisma.review.create({
    data: {
      userId,
      eventId,
      rating,
      text: text?.trim() || null,
    },
  });
}

export async function getEventReviews(
  eventId: string,
  limit = 10,
  offset = 0,
) {
  const [items, agg, totalCount] = await Promise.all([
    prisma.review.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        user: { select: { id: true, name: true, avatarEmoji: true } },
      },
    }),
    prisma.review.aggregate({
      where: { eventId },
      _avg: { rating: true },
    }),
    prisma.review.count({ where: { eventId } }),
  ]);

  return {
    items,
    avgRating: agg._avg.rating
      ? Math.round(agg._avg.rating * 10) / 10
      : null,
    totalCount,
  };
}

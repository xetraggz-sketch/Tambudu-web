import { prisma } from '@/lib/prisma';
import { REASON_LABELS, type ReasonType } from '@/lib/report-reasons';

export { REASON_LABELS, type ReasonType } from '@/lib/report-reasons';

export class ReportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportValidationError';
  }
}

export class DuplicateReportError extends Error {
  constructor() {
    super('Вы уже жаловались на это событие, мы рассматриваем');
    this.name = 'DuplicateReportError';
  }
}

export async function submitReport({
  userId,
  eventId,
  reasonType,
  comment,
}: {
  userId: string;
  eventId: string;
  reasonType: ReasonType;
  comment?: string;
}) {
  if (!(reasonType in REASON_LABELS)) {
    throw new ReportValidationError('Неверный тип причины');
  }

  if (reasonType === 'OTHER' && (!comment || comment.trim().length === 0)) {
    throw new ReportValidationError('Укажите причину жалобы');
  }

  const trimmedComment = comment?.trim().slice(0, 2000) || '';

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { authorId: true },
  });

  if (!event) {
    throw new ReportValidationError('Событие не найдено');
  }

  if (event.authorId === userId) {
    throw new ReportValidationError('Нельзя пожаловаться на своё событие');
  }

  const existing = await prisma.report.findFirst({
    where: { eventId, userId, status: 'OPEN' },
  });

  if (existing) {
    throw new DuplicateReportError();
  }

  const reason = trimmedComment
    ? `${REASON_LABELS[reasonType]}\n${trimmedComment}`
    : REASON_LABELS[reasonType];

  return prisma.report.create({
    data: {
      userId,
      eventId,
      reason,
      status: 'OPEN',
    },
  });
}

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEventFindUnique = vi.fn();
const mockReportFindFirst = vi.fn();
const mockReportCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
    },
    report: {
      findFirst: (...args: unknown[]) => mockReportFindFirst(...args),
      create: (...args: unknown[]) => mockReportCreate(...args),
    },
  },
}));

import {
  submitReport,
  ReportValidationError,
  DuplicateReportError,
  REASON_LABELS,
} from '@/lib/reports';

const USER_ID = 'user-1';
const AUTHOR_ID = 'author-1';
const EVENT_ID = 'event-1';

describe('submitReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventFindUnique.mockResolvedValue({ authorId: AUTHOR_ID });
    mockReportFindFirst.mockResolvedValue(null);
    mockReportCreate.mockResolvedValue({ id: 'report-1' });
  });

  it('создаёт жалобу с корректными данными (без комментария)', async () => {
    await submitReport({ userId: USER_ID, eventId: EVENT_ID, reasonType: 'SPAM' });

    expect(mockReportCreate).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        eventId: EVENT_ID,
        reason: REASON_LABELS.SPAM,
        status: 'OPEN',
      },
    });
  });

  it('создаёт жалобу с комментарием', async () => {
    await submitReport({
      userId: USER_ID,
      eventId: EVENT_ID,
      reasonType: 'FRAUD',
      comment: 'Подробности мошенничества',
    });

    expect(mockReportCreate).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        eventId: EVENT_ID,
        reason: `${REASON_LABELS.FRAUD}\nПодробности мошенничества`,
        status: 'OPEN',
      },
    });
  });

  it('запрещает автору жаловаться на своё событие', async () => {
    await expect(
      submitReport({ userId: AUTHOR_ID, eventId: EVENT_ID, reasonType: 'SPAM' }),
    ).rejects.toThrow(ReportValidationError);
    expect(mockReportCreate).not.toHaveBeenCalled();
  });

  it('запрещает дублирующую OPEN-жалобу', async () => {
    mockReportFindFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      submitReport({ userId: USER_ID, eventId: EVENT_ID, reasonType: 'SPAM' }),
    ).rejects.toThrow(DuplicateReportError);
    expect(mockReportCreate).not.toHaveBeenCalled();
  });

  it('требует комментарий при типе OTHER', async () => {
    await expect(
      submitReport({ userId: USER_ID, eventId: EVENT_ID, reasonType: 'OTHER' }),
    ).rejects.toThrow(ReportValidationError);

    await expect(
      submitReport({ userId: USER_ID, eventId: EVENT_ID, reasonType: 'OTHER', comment: '   ' }),
    ).rejects.toThrow(ReportValidationError);

    expect(mockReportCreate).not.toHaveBeenCalled();
  });

  it('обрезает комментарий длиннее 2000 символов', async () => {
    const longComment = 'a'.repeat(3000);

    await submitReport({
      userId: USER_ID,
      eventId: EVENT_ID,
      reasonType: 'MISMATCH',
      comment: longComment,
    });

    const callArg = mockReportCreate.mock.calls[0]![0] as { data: { reason: string } };
    const reasonText = callArg.data.reason;
    const commentPart = reasonText.split('\n')[1];
    expect(commentPart).toHaveLength(2000);
  });

  it('ошибка при несуществующем событии', async () => {
    mockEventFindUnique.mockResolvedValue(null);

    await expect(
      submitReport({ userId: USER_ID, eventId: EVENT_ID, reasonType: 'SPAM' }),
    ).rejects.toThrow(ReportValidationError);
    expect(mockReportCreate).not.toHaveBeenCalled();
  });
});

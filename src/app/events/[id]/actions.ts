'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import {
  registerForEvent,
  cancelRegistration,
  EventNotAvailableError,
  NoCapacityError,
  AlreadyRegisteredError,
} from '@/lib/registration';
import { InsufficientBalanceError } from '@/lib/balance';
import {
  submitReview,
  ReviewValidationError,
  DuplicateReviewError,
} from '@/lib/reviews';
import {
  submitReport,
  ReportValidationError,
  DuplicateReportError,
} from '@/lib/reports';
import type { ReasonType } from '@/lib/report-reasons';

export type ActionState = {
  ok?: boolean;
  error?: string;
  errorType?: 'balance' | 'capacity' | 'already' | 'generic';
  available?: number;
  required?: number;
};

export async function registerAction(eventId: string): Promise<ActionState> {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  try {
    await registerForEvent(userId, eventId);
    revalidatePath(`/events/${eventId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof InsufficientBalanceError) {
      return {
        error: `Недостаточно средств`,
        errorType: 'balance',
        available: e.available,
        required: e.required,
      };
    }
    if (e instanceof NoCapacityError) {
      return { error: 'Нет свободных мест', errorType: 'capacity' };
    }
    if (e instanceof AlreadyRegisteredError) {
      return { error: 'Вы уже записаны', errorType: 'already' };
    }
    if (e instanceof EventNotAvailableError) {
      return { error: e.message, errorType: 'generic' };
    }
    throw e;
  }
}

export async function cancelRegistrationAction(
  eventId: string,
): Promise<ActionState & { refunded?: number }> {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  try {
    const { refunded } = await cancelRegistration(userId, eventId);
    revalidatePath(`/events/${eventId}`);
    return { ok: true, refunded };
  } catch (e) {
    if (e instanceof EventNotAvailableError) {
      return { error: e.message, errorType: 'generic' };
    }
    throw e;
  }
}

export async function submitReviewAction({
  eventId,
  rating,
  text,
}: {
  eventId: string;
  rating: number;
  text?: string;
}): Promise<ActionState> {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  try {
    await submitReview({ userId, eventId, rating, text });
    revalidatePath(`/events/${eventId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof DuplicateReviewError) {
      return { error: e.message, errorType: 'already' };
    }
    if (e instanceof ReviewValidationError) {
      return { error: e.message, errorType: 'generic' };
    }
    throw e;
  }
}

export async function reportEventAction({
  eventId,
  reasonType,
  comment,
}: {
  eventId: string;
  reasonType: ReasonType;
  comment?: string;
}): Promise<ActionState> {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  try {
    await submitReport({ userId, eventId, reasonType, comment });
    return { ok: true };
  } catch (e) {
    if (e instanceof DuplicateReportError) {
      return { error: e.message, errorType: 'already' };
    }
    if (e instanceof ReportValidationError) {
      return { error: e.message, errorType: 'generic' };
    }
    throw e;
  }
}

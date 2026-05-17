'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { promoteEvent, EventNotAvailableError } from '@/lib/promotion';
import { InsufficientBalanceError } from '@/lib/balance';
import { formatRubles } from '@/lib/format';

export type DeleteEventState = {
  ok?: boolean;
  error?: string;
};

export async function deleteEventAction(
  eventId: string,
): Promise<DeleteEventState> {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { registrations: { where: { status: 'ACTIVE' } } } } },
  });

  if (!event) {
    return { error: 'Событие не найдено' };
  }

  if (event.authorId !== userId) {
    return { error: 'Нет доступа' };
  }

  if (event.status === 'APPROVED' && event._count.registrations > 0) {
    return { error: 'Нельзя удалить событие с активными регистрациями' };
  }

  await prisma.event.delete({ where: { id: eventId } });

  revalidatePath('/my-events');

  return { ok: true };
}

export async function promoteEventAction(
  eventId: string,
): Promise<{
  ok: boolean;
  error?: string;
  promotedUntil?: string;
  available?: number;
  required?: number;
}> {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  try {
    const result = await promoteEvent(userId, eventId);
    revalidatePath('/my-events');
    revalidatePath('/');
    return { ok: true, promotedUntil: result.promotedUntil.toISOString() };
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return {
        ok: false,
        error: `Недостаточно средств. Баланс: ${formatRubles(err.available)}`,
        available: err.available,
        required: err.required,
      };
    }
    if (err instanceof EventNotAvailableError) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: 'Ошибка при продвижении' };
  }
}

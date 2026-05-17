'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { topupUser } from '@/lib/balance';

type ActionResult = { ok: boolean; error?: string };

export async function approveEventAction(
  eventId: string,
): Promise<ActionResult> {
  await requireAdmin();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { ok: false, error: 'Событие не найдено' };
  if (event.status !== 'PENDING') return { ok: false, error: 'Событие не на модерации' };

  await prisma.event.update({
    where: { id: eventId },
    data: { status: 'APPROVED' },
  });

  revalidatePath('/');
  revalidatePath('/admin/moderation');
  revalidatePath('/admin');
  return { ok: true };
}

const rejectSchema = z.object({
  eventId: z.string().min(1),
  reason: z.string().min(3, 'Причина должна содержать минимум 3 символа'),
});

export async function rejectEventAction(
  eventId: string,
  reason: string,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = rejectSchema.safeParse({ eventId, reason });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' };
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { ok: false, error: 'Событие не найдено' };
  if (event.status !== 'PENDING') return { ok: false, error: 'Событие не на модерации' };

  await prisma.event.update({
    where: { id: eventId },
    data: { status: 'REJECTED', rejectionReason: reason },
  });

  revalidatePath('/admin/moderation');
  revalidatePath('/admin');
  return { ok: true };
}

export async function closeReportAction(
  reportId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const adminId = (session.user as { id: string }).id;

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return { ok: false, error: 'Жалоба не найдена' };
  if (report.status !== 'OPEN') return { ok: false, error: 'Жалоба уже закрыта' };

  await prisma.report.update({
    where: { id: reportId },
    data: { status: 'RESOLVED', resolvedById: adminId, resolvedAt: new Date() },
  });

  revalidatePath('/admin/reports');
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteEventByReportAction(
  reportId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const adminId = (session.user as { id: string }).id;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { event: true },
  });
  if (!report) return { ok: false, error: 'Жалоба не найдена' };

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: report.eventId },
      data: {
        status: 'REJECTED',
        rejectionReason: `Удалено по жалобе: ${report.reason}`,
      },
    });

    await tx.report.updateMany({
      where: { eventId: report.eventId, status: 'OPEN' },
      data: { status: 'RESOLVED', resolvedById: adminId, resolvedAt: new Date() },
    });
  });

  revalidatePath('/admin/reports');
  revalidatePath('/admin');
  revalidatePath('/');
  return { ok: true };
}

export async function searchUsersAction(
  query: string,
): Promise<{
  users: {
    id: string;
    name: string | null;
    email: string;
    avatarEmoji: string;
    balanceKopecks: number;
  }[];
}> {
  await requireAdmin();

  if (!query || query.length < 2) return { users: [] };

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarEmoji: true,
      balanceKopecks: true,
    },
    take: 10,
    orderBy: { email: 'asc' },
  });

  return { users };
}

const topupSchema = z.object({
  userId: z.string().min(1),
  rubles: z.number().int().min(1, 'Минимум 1 рубль'),
  comment: z.string().optional(),
});

export async function adminTopupAction(input: {
  userId: string;
  rubles: number;
  comment?: string;
}): Promise<ActionResult & { newBalance?: number }> {
  const session = await requireAdmin();
  const adminId = (session.user as { id: string }).id;

  const parsed = topupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' };
  }

  const { userId, rubles, comment } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: 'Пользователь не найден' };

  const { newBalance } = await topupUser(userId, rubles * 100, {
    adminId,
    ...(comment ? { comment } : {}),
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin/topup');
  return { ok: true, newBalance };
}

export async function toggleAdminAction(
  userId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const adminId = (session.user as { id: string }).id;

  if (userId === adminId) {
    return { ok: false, error: 'Нельзя изменить свою роль' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return { ok: false, error: 'Пользователь не найден' };

  await prisma.user.update({
    where: { id: userId },
    data: { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' },
  });

  revalidatePath('/admin/users');
  return { ok: true };
}

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { fileTypeFromBuffer } from 'file-type';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { extendSubscription } from '@/lib/subscription-server';
import { InsufficientBalanceError } from '@/lib/balance';

const AVATAR_EMOJIS = [
  '😀','😎','🦊','🐱','🐼','🚀','🌸','🎨','🎵','📚',
  '⚽','🍕','🎬','🌍','🌟','🔥','💜','🎭','🏔️','🌊',
  '🚲','🍃','☕','🎪','🎁','🎮','🎲','🎯','🌙','☀️',
] as const;

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE = 200 * 1024;

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
});

export async function updateProfileAction(data: { name: string }) {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name },
  });

  revalidatePath('/profile');
  revalidatePath('/');
  return { ok: true as const };
}

export async function updateAvatarEmojiAction(emoji: string) {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  if (!AVATAR_EMOJIS.includes(emoji as typeof AVATAR_EMOJIS[number])) {
    return { ok: false as const, error: 'Недопустимый эмодзи' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      avatarEmoji: emoji,
      avatarImage: null,
      avatarMime: null,
    },
  });

  revalidatePath('/profile');
  revalidatePath('/');
  return { ok: true as const };
}

export async function updateAvatarImageAction(formData: FormData) {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return { ok: false as const, error: 'Файл обязателен' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false as const, error: 'Файл больше 200 КБ' };
  }

  const buf = Buffer.from(await file.arrayBuffer());

  const ft = await fileTypeFromBuffer(buf);
  if (!ft || !(ALLOWED_MIMES as readonly string[]).includes(ft.mime)) {
    return { ok: false as const, error: 'Неверный тип файла. Допустимы: JPEG, PNG, WebP' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      avatarImage: buf,
      avatarMime: ft.mime,
    },
  });

  revalidatePath('/profile');
  revalidatePath('/');
  return { ok: true as const };
}

export async function removeAvatarImageAction() {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      avatarImage: null,
      avatarMime: null,
    },
  });

  revalidatePath('/profile');
  revalidatePath('/');
  return { ok: true as const };
}

export async function subscribeAction() {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  try {
    const result = await extendSubscription(userId);
    revalidatePath('/profile');
    return {
      ok: true as const,
      newSubscriptionUntil: result.newSubscriptionUntil.toISOString(),
    };
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return {
        ok: false as const,
        error: 'Недостаточно средств',
        available: err.available,
        required: err.required,
      };
    }
    return { ok: false as const, error: 'Ошибка при оформлении подписки' };
  }
}

'use server';

import { z } from 'zod';
import { hash } from 'bcryptjs';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { signIn, signOut } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { LIMITS } from '@/lib/constants';

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
}

const registerSchema = z
  .object({
    email: z.string().email('Некорректный email'),
    password: z
      .string()
      .min(8, 'Минимум 8 символов')
      .max(100, 'Максимум 100 символов'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Пароли не совпадают',
    path: ['confirm'],
  });

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const ip = await getClientIp();
  if (!checkRateLimit(`register:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return { error: 'Слишком много попыток, попробуйте через несколько минут' };
  }

  const raw = {
    email: (formData.get('email') as string | null)?.trim().toLowerCase() ?? '',
    password: formData.get('password') as string | null ?? '',
    confirm: formData.get('confirm') as string | null ?? '',
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Email уже занят' };
  }

  const passwordHash = await hash(password, LIMITS.BCRYPT_COST);

  try {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'USER',
        balanceKopecks: 0,
      },
    });
  } catch (e: unknown) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code: string }).code === 'P2002'
    ) {
      return { error: 'Email уже занят' };
    }
    throw e;
  }

  await signIn('credentials', {
    email,
    password,
    redirect: false,
  });

  redirect('/profile');
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const ip = await getClientIp();
  if (!checkRateLimit(`login:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return { error: 'Слишком много попыток, попробуйте через несколько минут' };
  }

  const raw = {
    email: (formData.get('email') as string | null)?.trim().toLowerCase() ?? '',
    password: formData.get('password') as string | null ?? '',
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  try {
    await signIn('credentials', {
      email: raw.email,
      password: raw.password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: 'Неверный email или пароль' };
    }
    throw e;
  }

  const callbackUrl =
    (formData.get('callbackUrl') as string | null) ?? '/profile';
  redirect(callbackUrl);
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}

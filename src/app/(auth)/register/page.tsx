'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { registerAction, type AuthState } from '../actions';

const initialState: AuthState = {};

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <div className="tb-card p-6">
      <h1 className="font-display text-2xl font-semibold mb-1">Регистрация</h1>
      <p className="text-muted-foreground text-sm mb-6">Создайте аккаунт за минуту</p>

      {state.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={action}>
        <div>
          <Label htmlFor="email" className="font-medium text-[13px] text-foreground">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="mt-1.5"
          />
          {state.fieldErrors?.email?.map((e) => (
            <p key={e} className="text-destructive text-sm mt-1">
              {e}
            </p>
          ))}
        </div>

        <div className="mt-4">
          <Label htmlFor="password" className="font-medium text-[13px] text-foreground">
            Пароль
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1.5"
          />
          <p className="text-muted-foreground text-xs mt-1">
            Минимум 8 символов
          </p>
          {state.fieldErrors?.password?.map((e) => (
            <p key={e} className="text-destructive text-sm mt-1">
              {e}
            </p>
          ))}
        </div>

        <div className="mt-4">
          <Label htmlFor="confirm" className="font-medium text-[13px] text-foreground">
            Подтвердите пароль
          </Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1.5"
          />
          {state.fieldErrors?.confirm?.map((e) => (
            <p key={e} className="text-destructive text-sm mt-1">
              {e}
            </p>
          ))}
        </div>

        <Button type="submit" disabled={pending} className="w-full mt-6">
          {pending && <Loader2 className="animate-spin" />}
          {pending ? 'Регистрируем\u2026' : 'Создать аккаунт'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-center">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-[color:var(--color-volga)] hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}

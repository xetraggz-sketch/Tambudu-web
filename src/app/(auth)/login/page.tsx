'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loginAction, type AuthState } from '../actions';

const initialState: AuthState = {};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/profile';
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <div className="tb-card p-6">
      <h1 className="font-display text-2xl font-semibold mb-1">Войти</h1>
      <p className="text-muted-foreground text-sm mb-6">Введите email и пароль</p>

      {state.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={action}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

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
            autoComplete="current-password"
            required
            className="mt-1.5"
          />
          {state.fieldErrors?.password?.map((e) => (
            <p key={e} className="text-destructive text-sm mt-1">
              {e}
            </p>
          ))}
        </div>

        <Button type="submit" disabled={pending} className="w-full mt-6">
          {pending && <Loader2 className="animate-spin" />}
          {pending ? 'Входим\u2026' : 'Войти'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-center">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-[color:var(--color-volga)] hover:underline">
          Зарегистрируйся
        </Link>
      </p>
    </div>
  );
}

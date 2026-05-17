'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { Menu, LogOut, User, CalendarPlus, ShieldCheck, History } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserAvatar } from '@/components/user/UserAvatar';
import { cn } from '@/lib/utils';
import { formatRubles } from '@/lib/format';
import { isSubscriber } from '@/lib/subscription';
import { logoutAction } from '@/app/(auth)/actions';

function NavLink({
  href,
  children,
  active,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'text-sm font-medium transition-colors hover:text-foreground',
        active
          ? 'text-foreground border-b-2 border-[color:var(--color-summer)] pb-[2px]'
          : 'text-muted-foreground',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Header({ session: initialSession }: { session: Session | null }) {
  const pathname = usePathname();
  const { data: clientSession } = useSession();
  const session = clientSession ?? initialSession;
  const user = session?.user;
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Лента' },
    ...(user ? [{ href: '/create-event', label: 'Создать' }] : []),
    ...(user ? [{ href: '/profile', label: 'Профиль' }] : []),
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Админ' }] : []),
  ];

  const avatarUser = {
    id: user?.id ?? '',
    name: user?.name,
    avatarEmoji: user?.avatarEmoji ?? '😀',
    hasAvatarImage: user?.hasAvatarImage ?? false,
  };

  return (
    <header className="bg-background border-b border-border">
      <div className="mx-auto flex h-14 md:h-16 max-w-screen-2xl items-center px-4">
        <Link
          href="/"
          className="font-display text-[22px] md:text-2xl font-bold text-foreground hover:opacity-90 transition-opacity"
        >
          ТамБуду
        </Link>

        <nav className="hidden items-center gap-4 ml-8 md:flex" aria-label="Главная навигация">
          {navLinks.map((l) => (
            <NavLink key={l.href} href={l.href} active={pathname === l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'gap-1.5',
                )}
              >
                <UserAvatar user={avatarUser} size="sm" decorative />
                <span className="max-w-[120px] truncate">
                  {user.name ?? user.email}
                </span>
                <span className="font-mono tabular text-xs text-muted-foreground">
                  {formatRubles(user.balanceKopecks)}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {user.name ?? user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRubles(user.balanceKopecks)}
                    {' · '}
                    {isSubscriber(user) ? 'Подписка активна' : 'Без подписки'}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/profile" />}>
                  <User className="mr-1.5 size-4" />
                  Профиль
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/my-events" />}>
                  <CalendarPlus className="mr-1.5 size-4" />
                  Мои события
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/transactions" />}>
                  <History className="mr-1.5 size-4" />
                  История транзакций
                </DropdownMenuItem>
                {user.role === 'ADMIN' && (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    <ShieldCheck className="mr-1.5 size-4" />
                    Админ
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <form action={logoutAction}>
                  <DropdownMenuItem
                    nativeButton
                    render={<button type="submit" className="w-full" />}
                  >
                    <LogOut className="mr-1.5 size-4" />
                    Выйти
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                Войти
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ size: 'sm' })}
              >
                Регистрация
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto md:hidden flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Меню" />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Меню</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3 px-4" aria-label="Мобильная навигация">
                {navLinks.map((l) => (
                  <SheetClose key={l.href} render={<span />}>
                    <NavLink
                      href={l.href}
                      active={pathname === l.href}
                      className="text-base"
                      onClick={() => setMobileOpen(false)}
                    >
                      {l.label}
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 p-4">
                {user ? (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <UserAvatar user={avatarUser} size="md" />
                      <div>
                        <p className="text-sm font-medium">
                          {user.name ?? user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRubles(user.balanceKopecks)}
                          {' · '}
                          {isSubscriber(user)
                            ? 'Подписка активна'
                            : 'Без подписки'}
                        </p>
                      </div>
                    </div>
                    <form action={logoutAction}>
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full"
                      >
                        <LogOut className="mr-1.5 size-4" />
                        Выйти
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={buttonVariants({
                        variant: 'outline',
                        className: 'w-full',
                      })}
                      onClick={() => setMobileOpen(false)}
                    >
                      Войти
                    </Link>
                    <Link
                      href="/register"
                      className={buttonVariants({ className: 'w-full' })}
                      onClick={() => setMobileOpen(false)}
                    >
                      Регистрация
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

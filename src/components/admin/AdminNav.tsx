'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Shield,
  AlertTriangle,
  Wallet,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, countKey: null },
  { href: '/admin/moderation', label: 'Модерация', icon: Shield, countKey: 'pendingCount' as const },
  { href: '/admin/reports', label: 'Жалобы', icon: AlertTriangle, countKey: 'openReportsCount' as const },
  { href: '/admin/topup', label: 'Пополнение', icon: Wallet, countKey: null },
  { href: '/admin/users', label: 'Юзеры', icon: Users, countKey: null },
];

export function AdminNav({
  counts,
}: {
  counts: { pendingCount: number; openReportsCount: number };
}) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-border bg-background"
      aria-label="Админ-навигация"
    >
      {items.map((item) => {
        const active =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        const count = item.countKey ? counts[item.countKey] : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <span className="relative">
              <Icon className="size-5" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex size-4 items-center justify-center rounded-full bg-[color:var(--color-summer)] text-[9px] font-bold text-white">
                  {count}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

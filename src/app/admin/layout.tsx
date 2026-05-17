import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LayoutDashboard,
  Shield,
  AlertTriangle,
  Wallet,
  Users,
} from 'lucide-react';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { AdminNav } from '@/components/admin/AdminNav';

export const metadata: Metadata = {
  title: 'Админ-панель | ТамБуду',
};

async function getCounts() {
  const [pendingCount, openReportsCount] = await Promise.all([
    prisma.event.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { status: 'OPEN' } }),
  ]);
  return { pendingCount, openReportsCount };
}

const navItems = [
  { href: '/admin', label: 'Дашборд', icon: 'dashboard' as const },
  { href: '/admin/moderation', label: 'Модерация', icon: 'moderation' as const, countKey: 'pendingCount' as const },
  { href: '/admin/reports', label: 'Жалобы', icon: 'reports' as const, countKey: 'openReportsCount' as const },
  { href: '/admin/topup', label: 'Пополнение', icon: 'topup' as const },
  { href: '/admin/users', label: 'Пользователи', icon: 'users' as const },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const counts = await getCounts();

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100dvh-4rem)]">
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-muted/30 p-4 gap-1">
        <p className="font-display text-sm font-semibold text-muted-foreground mb-3 px-2">
          Админ-панель
        </p>
        {navItems.map((item) => {
          const count = item.countKey ? counts[item.countKey] : undefined;
          return (
            <SidebarLink key={item.href} href={item.href} icon={item.icon} count={count}>
              {item.label}
            </SidebarLink>
          );
        })}
      </aside>

      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      <AdminNav counts={counts} />
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  count,
  children,
}: {
  href: string;
  icon: 'dashboard' | 'moderation' | 'reports' | 'topup' | 'users';
  count?: number;
  children: React.ReactNode;
}) {
  const icons = {
    dashboard: <LayoutDashboard className="size-4" />,
    moderation: <Shield className="size-4" />,
    reports: <AlertTriangle className="size-4" />,
    topup: <Wallet className="size-4" />,
    users: <Users className="size-4" />,
  };

  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {icons[icon]}
      <span className="flex-1">{children}</span>
      {count !== undefined && count > 0 && (
        <span className="tb-badge tb-badge-summer text-xs min-w-[1.25rem] text-center">
          {count}
        </span>
      )}
    </Link>
  );
}

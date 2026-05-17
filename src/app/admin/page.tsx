import Link from 'next/link';
import {
  Shield,
  AlertTriangle,
  Users,
  CalendarCheck,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatRubles } from '@/lib/format';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

async function getMetrics() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    pendingCount,
    openReportsCount,
    usersCount,
    approvedEventsCount,
    activeSubscriptionsCount,
    topupAgg,
  ] = await Promise.all([
    prisma.event.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { status: 'OPEN' } }),
    prisma.user.count(),
    prisma.event.count({ where: { status: 'APPROVED' } }),
    prisma.user.count({ where: { subscriptionUntil: { gt: now } } }),
    prisma.transaction.aggregate({
      _sum: { deltaKopecks: true },
      where: { type: 'TOPUP', createdAt: { gte: monthStart } },
    }),
  ]);

  return {
    pendingCount,
    openReportsCount,
    usersCount,
    approvedEventsCount,
    activeSubscriptionsCount,
    topupSumKopecks: topupAgg._sum.deltaKopecks ?? 0,
  };
}

const tiles = [
  {
    key: 'pendingCount' as const,
    label: 'На модерации',
    href: '/admin/moderation',
    icon: Shield,
    format: (v: number) => String(v),
  },
  {
    key: 'openReportsCount' as const,
    label: 'Открытые жалобы',
    href: '/admin/reports',
    icon: AlertTriangle,
    format: (v: number) => String(v),
  },
  {
    key: 'usersCount' as const,
    label: 'Пользователей',
    href: '/admin/users',
    icon: Users,
    format: (v: number) => String(v),
  },
  {
    key: 'approvedEventsCount' as const,
    label: 'Событий APPROVED',
    href: null,
    icon: CalendarCheck,
    format: (v: number) => String(v),
  },
  {
    key: 'activeSubscriptionsCount' as const,
    label: 'Активных подписок',
    href: null,
    icon: Sparkles,
    format: (v: number) => String(v),
  },
  {
    key: 'topupSumKopecks' as const,
    label: 'Пополнений за месяц',
    href: null,
    icon: CreditCard,
    format: (v: number) => formatRubles(v),
  },
];

export default async function AdminDashboardPage() {
  const metrics = await getMetrics();

  return (
    <div className="p-4 md:p-6">
      <h1 className="font-display text-2xl font-bold mb-6">Дашборд</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const value = metrics[tile.key];
          const content = (
            <Card key={tile.key} data-slot="metric-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {tile.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl font-bold tabular-nums">
                  {tile.format(value)}
                </p>
              </CardContent>
            </Card>
          );

          if (tile.href) {
            return (
              <Link
                key={tile.key}
                href={tile.href}
                className="hover:ring-2 hover:ring-ring/20 rounded-xl transition-shadow"
              >
                {content}
              </Link>
            );
          }

          return <div key={tile.key}>{content}</div>;
        })}
      </div>
    </div>
  );
}

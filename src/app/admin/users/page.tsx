import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { UsersTable } from '@/components/admin/UsersTable';

export const metadata: Metadata = {
  title: 'Пользователи | Админ | ТамБуду',
};

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatarEmoji: true,
      role: true,
      balanceKopecks: true,
      subscriptionUntil: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = users.map((u) => ({
    ...u,
    subscriptionUntil: u.subscriptionUntil?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="p-4 md:p-6">
      <h1 className="font-display text-2xl font-bold mb-6">Пользователи</h1>
      <UsersTable users={serialized} />
    </div>
  );
}

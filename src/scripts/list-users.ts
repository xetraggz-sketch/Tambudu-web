import { createPrisma, parseArgsTyped, c, formatRublesCli } from './_lib';

const args = parseArgsTyped<{
  limit?: string;
  search?: string;
}>({
  limit: { type: 'string', short: 'l', default: '50' },
  search: { type: 'string', short: 's' },
});

async function main() {
  const prisma = createPrisma();

  try {
    const limit = Math.max(1, Math.min(1000, Number(args.limit) || 50));
    const search = args.search?.trim();

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        avatarEmoji: true,
        email: true,
        name: true,
        role: true,
        balanceKopecks: true,
        subscriptionUntil: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (users.length === 0) {
      console.log(c.yellow('Пользователи не найдены'));
      return;
    }

    const now = new Date();
    const rows = users.map((u) => ({
      '🔹': u.avatarEmoji,
      'Email': u.email,
      'Имя': u.name ?? '—',
      'Роль': u.role,
      'Баланс': formatRublesCli(u.balanceKopecks),
      'Подписка': u.subscriptionUntil && u.subscriptionUntil > now
        ? u.subscriptionUntil.toLocaleDateString('ru-RU')
        : '—',
      'Создан': u.createdAt.toLocaleDateString('ru-RU'),
    }));

    console.log(c.bold(`\nПользователи (${users.length}):`));
    console.table(rows);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(c.red(String(err)));
  process.exit(1);
});

import { createPrisma, parseArgsTyped, c, die, confirm } from './_lib';

const args = parseArgsTyped<{
  email?: string;
  demote?: boolean;
  yes?: boolean;
}>({
  email: { type: 'string', short: 'e' },
  demote: { type: 'boolean', short: 'd', default: false },
  yes: { type: 'boolean', short: 'y', default: false },
});

if (!args.email) die('Не указан --email');

async function main() {
  const prisma = createPrisma();

  try {
    const email = args.email!.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) die(`Пользователь с email ${email} не найден`);

    const seedAdminEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();

    if (args.demote) {
      if (user.role !== 'ADMIN') {
        die(`${user.email} не является админом`);
      }
      if (user.email.toLowerCase() === seedAdminEmail) {
        die('Нельзя снять админство с первого админа (ADMIN_EMAIL из .env)');
      }

      console.log(
        `${c.bold('Снятие админства')}\n` +
          `  Юзер: ${user.name ?? '—'} (${user.email})\n` +
          `  Роль:  ${c.yellow('ADMIN')} → ${c.dim('USER')}`,
      );

      if (!args.yes) {
        const ok = await confirm('\nПодтверди');
        if (!ok) {
          console.log('Отменено.');
          return;
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'USER' },
      });

      console.log(c.green(`\n${user.email} теперь USER`));
    } else {
      if (user.role === 'ADMIN') {
        console.log(c.yellow(`${user.email} уже ADMIN`));
        return;
      }

      console.log(
        `${c.bold('Назначение админом')}\n` +
          `  Юзер: ${user.name ?? '—'} (${user.email})\n` +
          `  Роль:  ${c.dim('USER')} → ${c.yellow('ADMIN')}`,
      );

      if (!args.yes) {
        const ok = await confirm('\nПодтверди');
        if (!ok) {
          console.log('Отменено.');
          return;
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      });

      console.log(c.green(`\n${user.email} теперь ADMIN`));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(c.red(String(err)));
  process.exit(1);
});

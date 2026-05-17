import { createPrisma, parseArgsTyped, c, die, confirm, formatRublesCli } from './_lib';
import { topupUser } from '@/lib/balance';

const args = parseArgsTyped<{
  email?: string;
  amount?: string;
  comment?: string;
  yes?: boolean;
}>({
  email: { type: 'string', short: 'e' },
  amount: { type: 'string', short: 'a' },
  comment: { type: 'string', short: 'c' },
  yes: { type: 'boolean', short: 'y', default: false },
});

if (!args.email) die('Не указан --email');

const amountNum = Number(args.amount);
if (!args.amount || !Number.isFinite(amountNum) || amountNum <= 0 || !Number.isInteger(amountNum)) {
  die('--amount должен быть целым положительным числом (рубли)');
}

const HIGH_AMOUNT_THRESHOLD = 100_000;

async function main() {
  const prisma = createPrisma();

  try {
    const email = args.email!.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, balanceKopecks: true },
    });

    if (!user) die(`Пользователь с email ${email} не найден`);

    console.log(
      `${c.bold('Пополнение баланса')}\n` +
        `  Юзер:    ${user.name ?? '—'} (${user.email})\n` +
        `  Баланс:  ${formatRublesCli(user.balanceKopecks)}\n` +
        `  Сумма:   ${c.green(`+${amountNum}`)} \u20BD` +
        (args.comment ? `\n  Комментарий: ${args.comment}` : ''),
    );

    if (amountNum >= HIGH_AMOUNT_THRESHOLD) {
      console.log(c.yellow(`\n⚠ Большая сумма: ${amountNum.toLocaleString('ru-RU')} \u20BD — проверь правильность.`));
    }

    if (!args.yes) {
      const ok = await confirm('\nПодтверди пополнение');
      if (!ok) {
        console.log('Отменено.');
        return;
      }
    }

    const { newBalance } = await topupUser(user.id, amountNum * 100, {
      source: 'cli',
      ...(args.comment ? { comment: args.comment } : {}),
    });

    console.log(
      c.green(
        `\nПополнено: ${user.email} +${amountNum} \u20BD (новый баланс: ${formatRublesCli(newBalance)})`,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(c.red(String(err)));
  process.exit(1);
});

import { prisma } from '@/lib/prisma';
import { chargeUser } from '@/lib/balance';
import { PRICES } from '@/lib/constants';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function extendSubscription(
  userId: string,
  days: number = 30,
  tx?: TxClient,
): Promise<{ newSubscriptionUntil: Date }> {
  const run = async (client: TxClient) => {
    await chargeUser(
      userId,
      PRICES.SUBSCRIPTION_KOPECKS,
      'SUBSCRIPTION',
      { description: 'Подписка на 30 дней' },
      client,
    );

    const user = await client.user.findUniqueOrThrow({
      where: { id: userId },
      select: { subscriptionUntil: true },
    });

    const now = new Date();
    const base =
      user.subscriptionUntil && user.subscriptionUntil > now
        ? user.subscriptionUntil
        : now;
    const newUntil = new Date(base);
    newUntil.setDate(newUntil.getDate() + days);

    await client.user.update({
      where: { id: userId },
      data: { subscriptionUntil: newUntil },
    });

    return { newSubscriptionUntil: newUntil };
  };

  if (tx) return run(tx);
  return prisma.$transaction(run);
}

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Админ';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL и ADMIN_PASSWORD должны быть в .env');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: { email, passwordHash, name, role: 'ADMIN', avatarEmoji: '🛡️' },
  });
  console.log(`Admin seeded: ${admin.email}`);
}

main().finally(() => prisma.$disconnect());

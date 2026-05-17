import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export { isSubscriber } from '@/lib/subscription';

export async function getSession() {
  return auth();
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/');
  return session;
}

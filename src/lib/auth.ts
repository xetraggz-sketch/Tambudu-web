import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === 'string'
            ? credentials.email.trim().toLowerCase()
            : '';
        const password =
          typeof credentials?.password === 'string'
            ? credentials.password
            : '';

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          balanceKopecks: user.balanceKopecks,
          subscriptionUntil: user.subscriptionUntil,
          avatarEmoji: user.avatarEmoji,
          hasAvatarImage: !!user.avatarImage,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id!;
        token.role = user.role;
        token.balanceKopecks = user.balanceKopecks;
        token.subscriptionUntil = user.subscriptionUntil;
        token.avatarEmoji = user.avatarEmoji;
        token.hasAvatarImage = user.hasAvatarImage;
        token.lastRefresh = Date.now();
      }
      if (trigger === 'update' && session) {
        const s = session as {
          role?: 'USER' | 'ADMIN';
          balanceKopecks?: number;
          subscriptionUntil?: Date | null;
          avatarEmoji?: string;
          hasAvatarImage?: boolean;
        };
        if (s.role !== undefined) token.role = s.role;
        if (s.balanceKopecks !== undefined)
          token.balanceKopecks = s.balanceKopecks;
        if (s.subscriptionUntil !== undefined)
          token.subscriptionUntil = s.subscriptionUntil;
        if (s.avatarEmoji !== undefined) token.avatarEmoji = s.avatarEmoji;
        if (s.hasAvatarImage !== undefined)
          token.hasAvatarImage = s.hasAvatarImage;
        token.lastRefresh = Date.now();
      }
      const REFRESH_INTERVAL = 60 * 1000;
      const lastRefresh = (token.lastRefresh as number) ?? 0;
      if (Date.now() - lastRefresh > REFRESH_INTERVAL && token.userId) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: {
            role: true,
            balanceKopecks: true,
            subscriptionUntil: true,
            avatarEmoji: true,
            avatarImage: true,
          },
        });
        if (fresh) {
          token.role = fresh.role;
          token.balanceKopecks = fresh.balanceKopecks;
          token.subscriptionUntil = fresh.subscriptionUntil;
          token.avatarEmoji = fresh.avatarEmoji;
          token.hasAvatarImage = !!fresh.avatarImage;
        }
        token.lastRefresh = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.role = token.role as 'USER' | 'ADMIN';
      session.user.balanceKopecks = token.balanceKopecks as number;
      session.user.subscriptionUntil =
        (token.subscriptionUntil as Date | null) ?? null;
      session.user.avatarEmoji = (token.avatarEmoji as string) ?? '😀';
      session.user.hasAvatarImage = (token.hasAvatarImage as boolean) ?? false;
      return session;
    },
  },
});

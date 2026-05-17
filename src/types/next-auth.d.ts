import type { DefaultSession, DefaultJWT } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: 'USER' | 'ADMIN';
      balanceKopecks: number;
      subscriptionUntil: Date | null;
      avatarEmoji: string;
      hasAvatarImage: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'USER' | 'ADMIN';
    balanceKopecks: number;
    subscriptionUntil: Date | null;
    avatarEmoji: string;
    hasAvatarImage: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId: string;
    role: 'USER' | 'ADMIN';
    balanceKopecks: number;
    subscriptionUntil: Date | null;
    avatarEmoji: string;
    hasAvatarImage: boolean;
  }
}

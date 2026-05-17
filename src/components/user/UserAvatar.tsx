'use client';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg' | 'xl';
const sizePx: Record<Size, number> = { sm: 28, md: 40, lg: 56, xl: 96 };

export type UserAvatarProps = {
  user: {
    id: string;
    name?: string | null;
    avatarEmoji: string;
    hasAvatarImage?: boolean;
  };
  size?: Size;
  className?: string;
  decorative?: boolean;
  /** Cache-bust timestamp appended to avatar URL */
  ts?: number;
};

export function UserAvatar({
  user,
  size = 'md',
  className,
  decorative = false,
  ts,
}: UserAvatarProps) {
  const px = sizePx[size];
  const label = decorative ? '' : (user.name ?? 'Аватар');

  if (user.hasAvatarImage) {
    const src = `/api/users/${user.id}/avatar${ts ? `?ts=${ts}` : ''}`;
    return (
      <img
        src={src}
        alt={label}
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
        className={cn(
          'rounded-full object-cover bg-muted',
          className,
        )}
      />
    );
  }

  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-muted select-none',
        className,
      )}
      style={{ width: px, height: px, fontSize: Math.round(px * 0.55) }}
    >
      {user.avatarEmoji}
    </span>
  );
}

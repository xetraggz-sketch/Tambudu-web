'use client';

import { Star } from 'lucide-react';

type StarsProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
};

export function Stars({ value, onChange, size = 20 }: StarsProps) {
  const interactive = !!onChange;

  return (
    <span className="inline-flex gap-0.5" role={interactive ? 'radiogroup' : undefined} aria-label="Оценка">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === value}
              aria-label={`${star} из 5`}
              onClick={() => onChange(star)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(star);
                }
              }}
              className="cursor-pointer text-foreground hover:text-[color:var(--color-summer)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <Star
                size={size}
                fill={filled ? 'var(--color-summer)' : 'none'}
                stroke={filled ? 'var(--color-summer)' : 'currentColor'}
              />
            </button>
          );
        }

        return (
          <Star
            key={star}
            size={size}
            fill={filled ? 'var(--color-summer)' : 'none'}
            stroke={filled ? 'var(--color-summer)' : 'currentColor'}
            aria-hidden
          />
        );
      })}
    </span>
  );
}

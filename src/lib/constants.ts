export const DEFAULT_CITY = 'Самара';

export const PRICES = {
  SUBSCRIPTION_KOPECKS: 14_900,
  SUBSCRIPTION_DAYS: 30,
  PROMOTION_KOPECKS: 2_900,
  PROMOTION_DAYS: 7,
  SUBSCRIBER_DISCOUNT_PERCENT: 5,
} as const;

export const LIMITS = {
  FREE_EVENTS_PER_MONTH: 3,
  CANCEL_HOURS_BEFORE_START: 24,
  BCRYPT_COST: 12,
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  LECTURE: 'Лекции',
  WORKSHOP: 'Мастер-классы',
  SPORT: 'Спорт',
  MUSIC: 'Музыка',
  CINEMA: 'Кино',
  EXHIBITION: 'Выставки',
  WALK: 'Прогулки/экскурсии',
  MEETUP: 'Встречи по интересам',
  PERFORMANCE: 'Перформансы',
  OTHER: 'Другое',
};

export const CATEGORY_EMOJI: Record<string, string> = {
  LECTURE: '🎓',
  WORKSHOP: '🛠️',
  SPORT: '⚽',
  MUSIC: '🎵',
  CINEMA: '🎬',
  EXHIBITION: '🖼️',
  WALK: '🚶',
  MEETUP: '💬',
  PERFORMANCE: '🎭',
  OTHER: '✨',
};

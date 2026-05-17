import type { EventCategory } from '@/generated/prisma/client';

export const CATEGORIES: Record<EventCategory, { label: string; emoji: string }> = {
  LECTURE:     { label: 'Лекция',       emoji: '🎓' },
  WORKSHOP:    { label: 'Мастер-класс', emoji: '🛠️' },
  SPORT:       { label: 'Спорт',        emoji: '⚽' },
  MUSIC:       { label: 'Музыка',       emoji: '🎵' },
  CINEMA:      { label: 'Кино',         emoji: '🎬' },
  EXHIBITION:  { label: 'Выставка',     emoji: '🖼️' },
  WALK:        { label: 'Прогулка',     emoji: '🚶' },
  MEETUP:      { label: 'Встреча',      emoji: '💬' },
  PERFORMANCE: { label: 'Перформанс',   emoji: '🎭' },
  OTHER:       { label: 'Другое',       emoji: '✨' },
};

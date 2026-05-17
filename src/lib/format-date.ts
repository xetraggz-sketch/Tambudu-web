import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

export function formatDayMonth(d: Date): { day: string; month: string } {
  return {
    day: format(d, 'dd', { locale: ru }),
    month: format(d, 'LLL', { locale: ru }),
  };
}

export function formatTime(d: Date): string {
  return format(d, 'HH:mm', { locale: ru });
}

export function formatPrice(kopecks: number): string {
  if (kopecks === 0) return 'Бесплатно';
  const rubles = Math.floor(kopecks / 100);
  const formatted = rubles.toLocaleString('ru-RU').replace(/\s/g, '\u00a0');
  return `От ${formatted}\u00a0₽`;
}

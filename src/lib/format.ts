import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

export function formatRubles(kopecks: number): string {
  const rubles = Math.floor(kopecks / 100);
  return `${rubles.toLocaleString('ru-RU')}\u00A0\u20BD`;
}

export function formatEventDate(date: Date): string {
  return format(date, 'd MMMM в HH:mm', { locale: ru });
}

export function formatRelative(date: Date): string {
  return formatDistanceToNow(date, { locale: ru, addSuffix: true });
}

import type { EventCategory } from '@/generated/prisma/client';

export type MockEvent = {
  id: string;
  title: string;
  category: EventCategory;
  startsAt: Date;
  endsAt: Date | null;
  address: string;
  lat: number;
  lng: number;
  priceKopecks: number;
  capacity: number | null;
  registrationsCount: number;
  isPromoted: boolean;
  author: { id: string; name: string; avatarEmoji: string };
};

const inDays = (d: number, h: number) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  x.setHours(h, 0, 0, 0);
  return x;
};

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: 'm1', title: 'Лекция про деревянное зодчество Самары', category: 'LECTURE',
    startsAt: inDays(1, 19), endsAt: inDays(1, 21), address: 'ул. Куйбышева, 95',
    lat: 53.1956, lng: 50.1011, priceKopecks: 0, capacity: 40, registrationsCount: 17,
    isPromoted: true, author: { id: 'u1', name: 'Анна', avatarEmoji: '🦊' },
  },
  {
    id: 'm2', title: 'Вечерняя пробежка по набережной', category: 'SPORT',
    startsAt: inDays(2, 7), endsAt: null, address: 'Набережная Волги, у Ладьи',
    lat: 53.2018, lng: 50.1247, priceKopecks: 0, capacity: null, registrationsCount: 8,
    isPromoted: false, author: { id: 'u2', name: 'Иван', avatarEmoji: '🚴' },
  },
  {
    id: 'm3', title: 'Концерт инди-группы «Грачи»', category: 'MUSIC',
    startsAt: inDays(3, 20), endsAt: inDays(3, 23), address: 'ул. Молодогвардейская, 80',
    lat: 53.2003, lng: 50.1078, priceKopecks: 50000, capacity: 120, registrationsCount: 54,
    isPromoted: false, author: { id: 'u3', name: 'Мария', avatarEmoji: '🎵' },
  },
  {
    id: 'm4', title: 'Воркшоп по линогравюре', category: 'WORKSHOP',
    startsAt: inDays(5, 14), endsAt: inDays(5, 17), address: 'Куйбышевская, 113, ЦСИ',
    lat: 53.1929, lng: 50.0989, priceKopecks: 80000, capacity: 12, registrationsCount: 11,
    isPromoted: false, author: { id: 'u4', name: 'Дмитрий', avatarEmoji: '🎨' },
  },
  {
    id: 'm5', title: 'Кинопоказ во дворике на Ленинградской', category: 'CINEMA',
    startsAt: inDays(4, 21), endsAt: null, address: 'Ленинградская, 60',
    lat: 53.1965, lng: 50.1024, priceKopecks: 0, capacity: 50, registrationsCount: 22,
    isPromoted: false, author: { id: 'u5', name: 'Елена', avatarEmoji: '🌸' },
  },
  {
    id: 'm6', title: 'Прогулка-экскурсия по бункеру Сталина', category: 'WALK',
    startsAt: inDays(6, 12), endsAt: inDays(6, 14), address: 'ул. Фрунзе, 167',
    lat: 53.1985, lng: 50.1009, priceKopecks: 35000, capacity: 20, registrationsCount: 14,
    isPromoted: false, author: { id: 'u6', name: 'Сергей', avatarEmoji: '🚶' },
  },
];

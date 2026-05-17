import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import type { EventCategory } from '../src/generated/prisma/client';
import { addDays, addHours } from 'date-fns';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const FAKE_USERS = [
  { email: 'anna@example.com', name: 'Анна', avatarEmoji: '👩' },
  { email: 'ivan@example.com', name: 'Иван', avatarEmoji: '👨' },
  { email: 'maria@example.com', name: 'Мария', avatarEmoji: '👩‍🎨' },
  { email: 'dmitry@example.com', name: 'Дмитрий', avatarEmoji: '🧑‍💻' },
  { email: 'elena@example.com', name: 'Елена', avatarEmoji: '👩‍🏫' },
] as const;

const now = new Date();

interface SeedEvent {
  title: string;
  description: string;
  category: EventCategory;
  startsAt: Date;
  address: string;
  lat: number;
  lng: number;
  priceKopecks: number;
  capacity: number | null;
  authorIndex: number;
  promoted: boolean;
}

const CENTER_LAT = 53.2;
const CENTER_LNG = 50.15;
function rndOffset() {
  return (Math.random() - 0.5) * 0.1;
}

const SEED_EVENTS: SeedEvent[] = [
  {
    title: 'Лекция «Архитектура Самары XIX века»',
    description: 'Обзорная лекция по историческим зданиям центра Самары. Модерн, конструктивизм и деревянное зодчество.',
    category: 'LECTURE',
    startsAt: addHours(now, 3),
    address: 'ул. Куйбышева, 105',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: 30, authorIndex: 0, promoted: true,
  },
  {
    title: 'Мастер-класс по керамике',
    description: 'Лепим кружку из глины на гончарном круге. Все материалы включены.',
    category: 'WORKSHOP',
    startsAt: addHours(now, 5),
    address: 'ул. Ленинградская, 37',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 150000, capacity: 10, authorIndex: 1, promoted: true,
  },
  {
    title: 'Утренняя йога в парке Гагарина',
    description: 'Бесплатная утренняя йога для всех уровней. Возьмите коврик.',
    category: 'SPORT',
    startsAt: addHours(now, 8),
    address: 'Парк Гагарина, центральная аллея',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: null, authorIndex: 2, promoted: false,
  },
  {
    title: 'Джазовый вечер в «Подвале»',
    description: 'Живой джаз от самарского квартета. Вход свободный, бар работает.',
    category: 'MUSIC',
    startsAt: addHours(now, 12),
    address: 'ул. Молодогвардейская, 52',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: 50, authorIndex: 3, promoted: true,
  },
  {
    title: 'Кинопоказ «Летят журавли»',
    description: 'Бесплатный показ шедевра Калатозова с обсуждением после сеанса.',
    category: 'CINEMA',
    startsAt: addHours(now, 20),
    address: 'Кинотеатр «Художественный», ул. Куйбышева, 84',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: 40, authorIndex: 4, promoted: false,
  },
  {
    title: 'Выставка «Самара космическая»',
    description: 'История ракетостроения в Самаре. Экспонаты, фото, интерактив.',
    category: 'EXHIBITION',
    startsAt: addDays(now, 1),
    address: 'пр. Ленина, 21',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 30000, capacity: null, authorIndex: 0, promoted: true,
  },
  {
    title: 'Прогулка по Старому городу',
    description: 'Пешеходная экскурсия по историческому центру. Длительность 2 часа.',
    category: 'WALK',
    startsAt: addDays(now, 1),
    address: 'Площадь Революции',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 50000, capacity: 15, authorIndex: 1, promoted: false,
  },
  {
    title: 'Встреча книголюбов',
    description: 'Обсуждаем «Мастера и Маргариту». Приносите свои экземпляры!',
    category: 'MEETUP',
    startsAt: addDays(now, 2),
    address: 'Антикафе «Тёплый дом», ул. Самарская, 179',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: 20, authorIndex: 2, promoted: false,
  },
  {
    title: 'Перформанс «Город говорит»',
    description: 'Уличный перформанс от театральной студии «Колесо». Свободный вход.',
    category: 'PERFORMANCE',
    startsAt: addDays(now, 2),
    address: 'Набережная реки Волги',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: null, authorIndex: 3, promoted: true,
  },
  {
    title: 'Воркшоп по акварели',
    description: 'Рисуем пейзажи Самары акварелью. Для начинающих.',
    category: 'WORKSHOP',
    startsAt: addDays(now, 3),
    address: 'Арт-пространство «Виктория», ул. Некрасовская, 2',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 80000, capacity: 12, authorIndex: 4, promoted: false,
  },
  {
    title: 'Лекция «Волжская флора и фауна»',
    description: 'Учёный-биолог расскажет о редких видах самарской области.',
    category: 'LECTURE',
    startsAt: addDays(now, 3),
    address: 'Самарский университет, корпус 3',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: null, authorIndex: 0, promoted: false,
  },
  {
    title: 'Футбол в Загородном парке',
    description: 'Дворовый футбол. Приходите с командой или присоединяйтесь.',
    category: 'SPORT',
    startsAt: addDays(now, 4),
    address: 'Загородный парк, поле #2',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: null, authorIndex: 1, promoted: false,
  },
  {
    title: 'Концерт «Самарские барды»',
    description: 'Акустический концерт бардовской песни на свежем воздухе.',
    category: 'MUSIC',
    startsAt: addDays(now, 4),
    address: 'Струковский сад, летняя эстрада',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 10000, capacity: null, authorIndex: 2, promoted: false,
  },
  {
    title: 'Показ документального кино',
    description: 'Подборка короткометражек самарских режиссёров.',
    category: 'CINEMA',
    startsAt: addDays(now, 5),
    address: 'Галерея «Новое пространство», ул. Красноармейская, 1',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 20000, capacity: 25, authorIndex: 3, promoted: false,
  },
  {
    title: 'Выставка современного искусства',
    description: 'Работы молодых самарских художников. Открытие с фуршетом.',
    category: 'EXHIBITION',
    startsAt: addDays(now, 5),
    address: 'Галерея «Арт-центр», ул. Фрунзе, 110',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: null, authorIndex: 4, promoted: false,
  },
  {
    title: 'Велопрогулка вдоль Волги',
    description: 'Групповая велопрогулка 20 км. Средний темп. Свой велосипед.',
    category: 'WALK',
    startsAt: addDays(now, 6),
    address: 'Старт: Ладья (набережная)',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: null, authorIndex: 0, promoted: false,
  },
  {
    title: 'IT-митап: фронтенд 2026',
    description: 'Доклады о React 19, Next.js 16, TailwindCSS 4. Нетворкинг.',
    category: 'MEETUP',
    startsAt: addDays(now, 14),
    address: 'Коворкинг «Точка», ул. Галактионовская, 17',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: 40, authorIndex: 3, promoted: false,
  },
  {
    title: 'Мастер-класс по фотографии',
    description: 'Практика уличной фотографии: композиция, свет, storytelling.',
    category: 'WORKSHOP',
    startsAt: addDays(now, 20),
    address: 'Сквер Пушкина',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 100000, capacity: 8, authorIndex: 4, promoted: false,
  },
  {
    title: 'Танцевальный перформанс «Поток»',
    description: 'Современный танец под электронную музыку. Вход свободный.',
    category: 'PERFORMANCE',
    startsAt: addDays(now, 25),
    address: 'ДК «Звезда», ул. Ново-Садовая, 106',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 0, capacity: null, authorIndex: 1, promoted: false,
  },
  {
    title: 'Квиз «Самара: от крепости до мегаполиса»',
    description: 'Командная викторина по истории города. Призы победителям!',
    category: 'OTHER',
    startsAt: addDays(now, 30),
    address: 'Бар «Кому как», ул. Дачная, 2',
    lat: CENTER_LAT + rndOffset(), lng: CENTER_LNG + rndOffset(),
    priceKopecks: 30000, capacity: 5, authorIndex: 2, promoted: false,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const users = await Promise.all(
    FAKE_USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          passwordHash,
          name: u.name,
          avatarEmoji: u.avatarEmoji,
        },
      }),
    ),
  );
  console.log(`Seeded ${users.length} users`);

  let created = 0;
  let skipped = 0;
  for (const ev of SEED_EVENTS) {
    const author = users[ev.authorIndex]!;
    const existing = await prisma.event.findFirst({
      where: { title: ev.title, authorId: author.id },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.event.create({
      data: {
        title: ev.title,
        description: ev.description,
        category: ev.category,
        startsAt: ev.startsAt,
        address: ev.address,
        lat: ev.lat,
        lng: ev.lng,
        priceKopecks: ev.priceKopecks,
        capacity: ev.capacity,
        status: 'APPROVED',
        city: 'Самара',
        authorId: author.id,
        promotedUntil: ev.promoted ? addDays(now, 5) : null,
      },
    });
    created++;
  }

  console.log(`Events seeded: ${created} created, ${skipped} skipped`);
}

main().finally(() => prisma.$disconnect());

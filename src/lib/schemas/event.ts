import { z } from 'zod';

const EVENT_CATEGORIES = [
  'LECTURE', 'WORKSHOP', 'SPORT', 'MUSIC', 'CINEMA',
  'EXHIBITION', 'WALK', 'MEETUP', 'PERFORMANCE', 'OTHER',
] as const;

const baseFields = {
  title: z
    .string()
    .min(3, 'Минимум 3 символа')
    .max(120, 'Максимум 120 символов'),
  description: z
    .string()
    .min(10, 'Минимум 10 символов')
    .max(5000, 'Максимум 5000 символов'),
  category: z.enum(EVENT_CATEGORIES, {
    error: 'Выберите категорию',
  }),
  address: z
    .string()
    .min(5, 'Минимум 5 символов')
    .max(200, 'Максимум 200 символов'),
} as const;

export const createEventFormSchema = z
  .object({
    ...baseFields,
    startsAt: z.date({ error: 'Укажите дату начала' }),
    endsAt: z.date({ error: 'Некорректная дата окончания' }).nullable().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    priceRubles: z
      .number({ error: 'Укажите цену' })
      .min(0, 'Цена не может быть отрицательной')
      .max(100000, 'Максимум 100 000 ₽'),
    capacity: z
      .number({ error: 'Некорректная вместимость' })
      .int('Должно быть целым числом')
      .min(1, 'Минимум 1')
      .max(10000, 'Максимум 10 000')
      .nullable()
      .optional(),
  })
  .refine(
    (d) => d.startsAt > new Date(),
    { message: 'Дата начала должна быть в будущем', path: ['startsAt'] },
  )
  .refine(
    (d) => !d.endsAt || d.endsAt > d.startsAt,
    { message: 'Дата окончания должна быть позже начала', path: ['endsAt'] },
  );

export const createEventSchema = z
  .object({
    ...baseFields,
    startsAt: z.coerce.date({ error: 'Укажите дату начала' }),
    endsAt: z.coerce
      .date({ error: 'Некорректная дата окончания' })
      .nullable()
      .optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    priceRubles: z.coerce
      .number({ error: 'Укажите цену' })
      .min(0, 'Цена не может быть отрицательной')
      .max(100000, 'Максимум 100 000 ₽'),
    capacity: z.coerce
      .number({ error: 'Некорректная вместимость' })
      .int('Должно быть целым числом')
      .min(1, 'Минимум 1')
      .max(10000, 'Максимум 10 000')
      .nullable()
      .optional(),
  })
  .refine(
    (d) => d.startsAt > new Date(),
    { message: 'Дата начала должна быть в будущем', path: ['startsAt'] },
  )
  .refine(
    (d) => !d.endsAt || d.endsAt > d.startsAt,
    { message: 'Дата окончания должна быть позже начала', path: ['endsAt'] },
  );

export type CreateEventInput = z.infer<typeof createEventFormSchema>;

import { z } from 'zod';

export const topupFormSchema = z.object({
  userId: z.string().min(1, 'Выберите пользователя'),
  rubles: z.number().int().min(1, 'Минимум 1 рубль'),
  comment: z.string().optional(),
});

export type TopupFormInput = z.infer<typeof topupFormSchema>;

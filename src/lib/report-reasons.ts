export type ReasonType = 'SPAM' | 'MISMATCH' | 'OFFENSIVE' | 'FRAUD' | 'OTHER';

export const REASON_LABELS: Record<ReasonType, string> = {
  SPAM: 'Спам / реклама',
  MISMATCH: 'Не соответствует описанию',
  OFFENSIVE: 'Оскорбительный контент',
  FRAUD: 'Мошенничество',
  OTHER: 'Другое',
};

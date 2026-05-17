import { describe, it, expect } from 'vitest';
import { formatRubles, formatEventDate, formatRelative } from '../format';

describe('formatRubles', () => {
  it('форматирует 0 копеек', () => {
    expect(formatRubles(0)).toBe('0\u00A0\u20BD');
  });

  it('форматирует 14900 копеек как 149 ₽', () => {
    expect(formatRubles(14_900)).toBe('149\u00A0\u20BD');
  });

  it('форматирует 100000 копеек с разделителем тысяч', () => {
    const result = formatRubles(100_000);
    expect(result).toContain('1');
    expect(result).toContain('000');
    expect(result).toContain('\u20BD');
  });

  it('отбрасывает копейки (floor)', () => {
    expect(formatRubles(99)).toBe('0\u00A0\u20BD');
  });

  it('форматирует 100 копеек как 1 ₽', () => {
    expect(formatRubles(100)).toBe('1\u00A0\u20BD');
  });
});

describe('formatEventDate', () => {
  it('форматирует дату как "д месяц в ЧЧ:ММ"', () => {
    const date = new Date(2026, 3, 12, 18, 0);
    const result = formatEventDate(date);
    expect(result).toBe('12 апреля в 18:00');
  });

  it('форматирует январскую дату', () => {
    const date = new Date(2026, 0, 1, 10, 30);
    const result = formatEventDate(date);
    expect(result).toBe('1 января в 10:30');
  });
});

describe('formatRelative', () => {
  it('возвращает строку с суффиксом', () => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const result = formatRelative(future);
    expect(result).toContain('через');
  });

  it('возвращает строку для прошедшей даты', () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const result = formatRelative(past);
    expect(result).toContain('назад');
  });
});

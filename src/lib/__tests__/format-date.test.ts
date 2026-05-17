import { describe, it, expect } from 'vitest';
import { formatPrice, formatDayMonth, formatTime } from '../format-date';

describe('formatPrice', () => {
  it('returns Бесплатно for 0', () => {
    expect(formatPrice(0)).toBe('Бесплатно');
  });

  it('formats 29000 kopecks correctly', () => {
    expect(formatPrice(29000)).toBe('От 290\u00a0₽');
  });

  it('formats 150000 kopecks with thousands separator', () => {
    expect(formatPrice(150000)).toMatch(/^От 1[\u00a0 ]500\u00a0₽$/);
  });

  it('formats 50000 kopecks', () => {
    expect(formatPrice(50000)).toBe('От 500\u00a0₽');
  });
});

describe('formatDayMonth', () => {
  it('returns day and month', () => {
    const d = new Date(2026, 4, 26, 19, 0);
    const result = formatDayMonth(d);
    expect(result.day).toBe('26');
    expect(result.month).toBeTruthy();
  });
});

describe('formatTime', () => {
  it('returns HH:mm', () => {
    const d = new Date(2026, 4, 26, 19, 0);
    expect(formatTime(d)).toBe('19:00');
  });

  it('pads single digit hours', () => {
    const d = new Date(2026, 0, 1, 7, 5);
    expect(formatTime(d)).toBe('07:05');
  });
});

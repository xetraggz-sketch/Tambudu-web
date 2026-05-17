import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit, _resetStore } from '../rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetStore();
    vi.useRealTimers();
  });

  it('разрешает запросы до лимита', () => {
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit('test-key', 3, 60_000)).toBe(true);
    }
  });

  it('блокирует после лимита', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('test-key', 3, 60_000);
    }
    expect(checkRateLimit('test-key', 3, 60_000)).toBe(false);
  });

  it('сбрасывает после windowMs', () => {
    vi.useFakeTimers();

    for (let i = 0; i < 3; i++) {
      checkRateLimit('test-key', 3, 10_000);
    }
    expect(checkRateLimit('test-key', 3, 10_000)).toBe(false);

    vi.advanceTimersByTime(10_001);
    expect(checkRateLimit('test-key', 3, 10_000)).toBe(true);
  });

  it('изолирует ключи', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('key-a', 3, 60_000);
    }
    expect(checkRateLimit('key-a', 3, 60_000)).toBe(false);
    expect(checkRateLimit('key-b', 3, 60_000)).toBe(true);
  });
});

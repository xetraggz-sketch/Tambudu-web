import { describe, it, expect } from 'vitest';
import { isSubscriber } from '../subscription';

describe('isSubscriber', () => {
  it('возвращает false при null', () => {
    expect(isSubscriber({ subscriptionUntil: null })).toBe(false);
  });

  it('возвращает false при прошедшей дате', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(isSubscriber({ subscriptionUntil: past })).toBe(false);
  });

  it('возвращает true при будущей дате', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(isSubscriber({ subscriptionUntil: future })).toBe(true);
  });
});

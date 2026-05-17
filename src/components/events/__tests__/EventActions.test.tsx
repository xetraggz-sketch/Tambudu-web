import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/app/events/[id]/actions', () => ({
  registerAction: vi.fn(),
  cancelRegistrationAction: vi.fn(),
}));

import { EventActions } from '../EventActions';

const BASE_EVENT = {
  id: 'evt-1',
  priceKopecks: 0,
  capacity: null,
  registrationsCount: 5,
  startsAt: new Date(Date.now() + 86400000),
  authorId: 'author-1',
};

describe('EventActions', () => {
  it('гость видит кнопку «Войти, чтобы записаться»', () => {
    render(
      <EventActions
        event={BASE_EVENT}
        userId={undefined}
        isSubscriber={false}
        isPast={false}
      />,
    );
    expect(screen.getByText('Войти, чтобы записаться')).toBeDefined();
  });

  it('автор видит «Это ваше событие»', () => {
    render(
      <EventActions
        event={BASE_EVENT}
        userId="author-1"
        isSubscriber={false}
        isPast={false}
      />,
    );
    expect(screen.getByText('Это ваше событие')).toBeDefined();
  });

  it('обычный юзер видит «Записаться»', () => {
    render(
      <EventActions
        event={BASE_EVENT}
        userId="user-1"
        isSubscriber={false}
        isPast={false}
      />,
    );
    expect(screen.getByText('Записаться')).toBeDefined();
  });

  it('завершённое событие показывает «Завершено»', () => {
    render(
      <EventActions
        event={BASE_EVENT}
        userId="user-1"
        isSubscriber={false}
        isPast={true}
      />,
    );
    expect(screen.getByText('Завершено')).toBeDefined();
  });

  it('нет мест → «Мест нет»', () => {
    render(
      <EventActions
        event={{ ...BASE_EVENT, capacity: 5, registrationsCount: 5 }}
        userId="user-1"
        isSubscriber={false}
        isPast={false}
      />,
    );
    expect(screen.getByText('Мест нет')).toBeDefined();
  });

  it('платное + подписчик → показывает скидку', () => {
    render(
      <EventActions
        event={{ ...BASE_EVENT, priceKopecks: 100000 }}
        userId="user-1"
        isSubscriber={true}
        isPast={false}
      />,
    );
    expect(screen.getByText(/для подписчиков/)).toBeDefined();
  });

  it('бесплатное → показывает «Бесплатно»', () => {
    render(
      <EventActions
        event={BASE_EVENT}
        userId="user-1"
        isSubscriber={false}
        isPast={false}
      />,
    );
    expect(screen.getByText('Бесплатно')).toBeDefined();
  });
});

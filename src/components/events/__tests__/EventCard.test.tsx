import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCard, type EventCardData } from '../EventCard';

const baseEvent: EventCardData = {
  id: 't1',
  title: 'Test Event',
  category: 'LECTURE',
  startsAt: new Date(2026, 4, 26, 19, 0),
  address: 'Test Address',
  priceKopecks: 0,
  capacity: 40,
  registrationsCount: 17,
  isPromoted: false,
  author: { id: 'u1', name: 'Author', avatarEmoji: '🦊' },
};

describe('EventCard', () => {
  it('renders promoted card with badge', () => {
    const { container } = render(
      <EventCard event={{ ...baseEvent, isPromoted: true }} />,
    );
    const link = container.querySelector('a');
    expect(link?.className).toContain('promoted-card');
    expect(screen.getByText(/Рекомендуем/)).toBeTruthy();
  });

  it('shows Бесплатно badge for free events', () => {
    render(<EventCard event={{ ...baseEvent, priceKopecks: 0 }} />);
    expect(screen.getByText('Бесплатно')).toBeTruthy();
  });

  it('shows formatted price for paid events', () => {
    render(<EventCard event={{ ...baseEvent, priceKopecks: 29000 }} />);
    expect(screen.getByText(/290/)).toBeTruthy();
  });

  it('shows registration count with capacity', () => {
    render(
      <EventCard
        event={{ ...baseEvent, capacity: 40, registrationsCount: 17 }}
      />,
    );
    expect(screen.getByText('17 / 40')).toBeTruthy();
  });

  it('shows registration count without capacity', () => {
    render(
      <EventCard
        event={{ ...baseEvent, capacity: null, registrationsCount: 8 }}
      />,
    );
    expect(screen.getByText('Записалось 8')).toBeTruthy();
  });
});

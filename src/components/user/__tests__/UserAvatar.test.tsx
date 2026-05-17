import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from '../UserAvatar';

const baseUser = { id: 'u1', name: 'Test', avatarEmoji: '🦊' };

describe('UserAvatar', () => {
  it('renders img when hasAvatarImage is true', () => {
    render(<UserAvatar user={{ ...baseUser, hasAvatarImage: true }} />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
    expect(img.src).toContain('/api/users/u1/avatar');
  });

  it('renders emoji span when hasAvatarImage is false', () => {
    render(<UserAvatar user={{ ...baseUser, hasAvatarImage: false }} />);
    const el = screen.getByRole('img');
    expect(el.tagName).toBe('SPAN');
    expect(el.textContent).toBe('🦊');
  });

  it('renders emoji span when hasAvatarImage is undefined', () => {
    render(<UserAvatar user={baseUser} />);
    const el = screen.getByRole('img');
    expect(el.textContent).toBe('🦊');
  });
});

import { Capacitor } from '@capacitor/core';

export function apiBase(): string {
  if (typeof window === 'undefined') return '';
  if (Capacitor.isNativePlatform())
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return '';
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${apiBase()}${path}`, { ...init, credentials: 'include' });
}

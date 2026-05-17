'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { canCreateEvent } from '@/lib/moderation';
import { createEventSchema } from '@/lib/schemas/event';
import { DEFAULT_CITY } from '@/lib/constants';
import { SAMARA_CENTER } from '@/lib/design-tokens';

async function geocodeAddress(
  address: string,
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${address}, ${city}, Россия`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'User-Agent': 'TamBudu/1.0' } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    const first = data[0];
    if (!first) return null;
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  } catch {
    return null;
  }
}

export type CreateEventState = {
  ok?: boolean;
  eventId?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createEventAction(
  input: unknown,
): Promise<CreateEventState> {
  const session = await requireUser();
  const userId = (session.user as { id: string }).id;

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  const limit = await canCreateEvent(userId);
  if (!limit.canCreate) {
    return { error: limit.reason ?? 'Лимит исчерпан' };
  }

  const data = parsed.data;
  const priceKopecks = Math.round(data.priceRubles * 100);

  let lat = data.lat;
  let lng = data.lng;
  if (lat === undefined || lng === undefined) {
    const geo = await geocodeAddress(data.address, DEFAULT_CITY);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    } else {
      lat = SAMARA_CENTER.lat;
      lng = SAMARA_CENTER.lng;
    }
  }

  const event = await prisma.event.create({
    data: {
      authorId: userId,
      title: data.title,
      description: data.description,
      category: data.category,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      address: data.address,
      lat,
      lng,
      priceKopecks,
      capacity: data.capacity ?? null,
      status: 'PENDING',
      city: DEFAULT_CITY,
    },
  });

  revalidatePath('/my-events');

  return { ok: true, eventId: event.id };
}

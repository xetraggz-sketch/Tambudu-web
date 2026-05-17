import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const events = await prisma.event.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 1000,
  });

  const eventEntries: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${baseUrl}/events/${e.id}`,
    lastModified: e.updatedAt,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...eventEntries,
  ];
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const u = await prisma.user.findUnique({
    where: { id },
    select: { avatarImage: true, avatarMime: true, updatedAt: true },
  });
  if (!u || !u.avatarImage || !u.avatarMime) {
    return new NextResponse(null, { status: 404 });
  }
  const buf = u.avatarImage as Buffer;
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': u.avatarMime,
      'Cache-Control': 'public, max-age=60, must-revalidate',
      'Content-Length': String(buf.byteLength),
      'ETag': `W/"${u.updatedAt.getTime()}"`,
    },
  });
}

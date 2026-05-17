import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ReportList } from '@/components/admin/ReportList';

export const metadata: Metadata = {
  title: 'Жалобы | Админ | ТамБуду',
};

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'asc' },
    include: {
      event: { select: { id: true, title: true, status: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="font-display text-2xl font-bold mb-6">Жалобы</h1>
      {reports.length === 0 ? (
        <div className="tb-card p-8 text-center">
          <p className="text-muted-foreground text-lg">Нет открытых жалоб</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportList
              key={report.id}
              report={{
                id: report.id,
                reason: report.reason,
                createdAt: report.createdAt.toISOString(),
                event: report.event,
                user: report.user,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

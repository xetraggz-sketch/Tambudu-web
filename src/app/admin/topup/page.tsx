import type { Metadata } from 'next';
import { TopupForm } from '@/components/admin/TopupForm';

export const metadata: Metadata = {
  title: 'Пополнение баланса | Админ | ТамБуду',
};

export default function TopupPage() {
  return (
    <div className="p-4 md:p-6 max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-6">Пополнение баланса</h1>
      <TopupForm />
    </div>
  );
}

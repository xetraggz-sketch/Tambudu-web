'use client';

import { useState, useMemo, useTransition } from 'react';
import { ArrowUpDown, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/user/UserAvatar';
import { formatRubles } from '@/lib/format';
import { toggleAdminAction } from '@/app/admin/actions';
import type { Role } from '@/generated/prisma/client';

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  avatarEmoji: string;
  role: Role;
  balanceKopecks: number;
  subscriptionUntil: string | null;
  createdAt: string;
};

type SortKey = 'name' | 'email' | 'role' | 'balanceKopecks' | 'createdAt';

export function UsersTable({ users: initial }: { users: UserRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initial.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name?.toLowerCase().includes(q) ?? false),
    );
  }, [initial, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number'
        ? (av as number) - (bv as number)
        : String(av).localeCompare(String(bv), 'ru');
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function handleToggleAdmin(userId: string) {
    setPendingUserId(userId);
    startTransition(async () => {
      const result = await toggleAdminAction(userId);
      setPendingUserId(null);
      if (result.ok) {
        toast.success('Роль изменена');
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  const now = new Date();

  return (
    <div className="space-y-4">
      <Input
        placeholder="Поиск по email или имени..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 px-2 font-medium text-muted-foreground">Юзер</th>
              <SortHeader label="Email" sortKey="email" current={sortKey} onToggle={toggleSort} />
              <SortHeader label="Роль" sortKey="role" current={sortKey} onToggle={toggleSort} />
              <SortHeader label="Баланс" sortKey="balanceKopecks" current={sortKey} onToggle={toggleSort} />
              <th className="py-2 px-2 font-medium text-muted-foreground">Подписка</th>
              <SortHeader label="Регистрация" sortKey="createdAt" current={sortKey} onToggle={toggleSort} />
              <th className="py-2 px-2 font-medium text-muted-foreground">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((user) => {
              const subActive =
                user.subscriptionUntil && new Date(user.subscriptionUntil) > now;
              return (
                <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        user={{ id: user.id, name: user.name, avatarEmoji: user.avatarEmoji }}
                        size="sm"
                        decorative
                      />
                      <span className="truncate max-w-[120px]">{user.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">{user.email}</td>
                  <td className="py-2 px-2">
                    <span className={user.role === 'ADMIN' ? 'tb-badge tb-badge-summer' : 'tb-badge'}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-mono tabular-nums">
                    {formatRubles(user.balanceKopecks)}
                  </td>
                  <td className="py-2 px-2">
                    {subActive ? (
                      <span className="tb-badge tb-badge-olive">Активна</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="py-2 px-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleToggleAdmin(user.id)}
                      aria-label={user.role === 'ADMIN' ? 'Снять админа' : 'Сделать админом'}
                    >
                      {isPending && pendingUserId === user.id ? (
                        <Loader2 className="animate-spin size-4" />
                      ) : user.role === 'ADMIN' ? (
                        <ShieldOff className="size-4" />
                      ) : (
                        <ShieldCheck className="size-4" />
                      )}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Пользователи не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  onToggle,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  onToggle: (key: SortKey) => void;
}) {
  return (
    <th className="py-2 px-2">
      <button
        className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => onToggle(sortKey)}
      >
        {label}
        <ArrowUpDown className={`size-3 ${current === sortKey ? 'text-foreground' : ''}`} />
      </button>
    </th>
  );
}

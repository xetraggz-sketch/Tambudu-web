'use client';

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/user/UserAvatar';
import { formatRubles } from '@/lib/format';
import { topupFormSchema, type TopupFormInput } from '@/lib/schemas/topup';
import { searchUsersAction, adminTopupAction } from '@/app/admin/actions';

type SearchUser = {
  id: string;
  name: string | null;
  email: string;
  avatarEmoji: string;
  balanceKopecks: number;
};

export function TopupForm() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TopupFormInput>({
    resolver: zodResolver(topupFormSchema),
    defaultValues: { userId: '', rubles: undefined, comment: '' },
  });

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    startTransition(async () => {
      const { users } = await searchUsersAction(q);
      setResults(users);
      setShowDropdown(users.length > 0);
    });
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedUser(null);
    setValue('userId', '');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  function selectUser(user: SearchUser) {
    setSelectedUser(user);
    setQuery(user.email);
    setValue('userId', user.id);
    setShowDropdown(false);
  }

  function onSubmit(data: TopupFormInput) {
    startTransition(async () => {
      const result = await adminTopupAction(data);
      if (result.ok) {
        toast.success('Пополнено');
        reset();
        setQuery('');
        setSelectedUser(null);
        setResults([]);
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user-search">Поиск пользователя</Label>
        <div className="relative">
          <Input
            id="user-search"
            placeholder="Email или имя..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            autoComplete="off"
          />
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl border border-border bg-popover shadow-md max-h-60 overflow-y-auto">
              {results.map((user) => (
                <button
                  type="button"
                  key={user.id}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                  onClick={() => selectUser(user)}
                >
                  <UserAvatar
                    user={{ id: user.id, name: user.name, avatarEmoji: user.avatarEmoji }}
                    size="sm"
                    decorative
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{user.name ?? user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatRubles(user.balanceKopecks)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.userId && (
          <p className="text-destructive text-sm">{errors.userId.message}</p>
        )}
      </div>

      {selectedUser && (
        <div className="tb-card p-3 flex items-center gap-3">
          <UserAvatar
            user={{
              id: selectedUser.id,
              name: selectedUser.name,
              avatarEmoji: selectedUser.avatarEmoji,
            }}
            size="md"
          />
          <div>
            <p className="font-medium text-sm">
              {selectedUser.name ?? selectedUser.email}
            </p>
            <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            <p className="font-mono text-xs">
              Баланс: {formatRubles(selectedUser.balanceKopecks)}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="topup-amount">Сумма в рублях</Label>
        <Input
          id="topup-amount"
          type="number"
          min={1}
          step={1}
          placeholder="100"
          {...register('rubles', { valueAsNumber: true })}
        />
        {errors.rubles && (
          <p className="text-destructive text-sm">{errors.rubles.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="topup-comment">Комментарий (опционально)</Label>
        <Textarea
          id="topup-comment"
          placeholder="Причина пополнения..."
          rows={2}
          {...register('comment')}
        />
      </div>

      <Button type="submit" disabled={isPending || !selectedUser}>
        {isPending && <Loader2 className="animate-spin size-4 mr-1.5" />}
        Пополнить
      </Button>
    </form>
  );
}

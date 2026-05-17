'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES } from '@/lib/categories';
import type { EventCategory } from '@/generated/prisma/client';
import type { FeedParams } from '@/lib/feed';

const DATE_OPTIONS = [
  { value: 'all', label: 'Любая дата' },
  { value: 'today', label: 'Сегодня' },
  { value: 'tomorrow', label: 'Завтра' },
  { value: 'week', label: 'На неделе' },
] as const;

const PRICE_OPTIONS = [
  { value: 'all', label: 'Любая цена' },
  { value: 'free', label: 'Бесплатно' },
  { value: 'paid', label: 'Платные' },
] as const;

const SORT_OPTIONS = [
  { value: 'soon', label: 'Скоро' },
  { value: 'popular', label: 'Популярные' },
  { value: 'new', label: 'Новые' },
] as const;

const CATEGORY_ENTRIES = Object.entries(CATEGORIES) as [
  EventCategory,
  { label: string; emoji: string },
][];

export function EventFilters({ initial }: { initial: FeedParams }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(initial.q ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const pushParams = useCallback(
    (updates: Partial<Record<string, string>>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === 'all' || v === '') {
          sp.delete(k);
        } else {
          sp.set(k, v);
        }
      }
      sp.delete('page');
      startTransition(() => {
        router.push(`/?${sp.toString()}`, { scroll: false });
      });
    },
    [router, searchParams, startTransition],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setQ(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        pushParams({ q: value.trim() });
      }, 350);
    },
    [pushParams],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleCategoryToggle = useCallback(
    (cat: EventCategory) => {
      const current = initial.category ?? [];
      const next = current.includes(cat)
        ? current.filter((c) => c !== cat)
        : [...current, cat];
      pushParams({ category: next.join(',') });
    },
    [initial.category, pushParams],
  );

  const hasFilters =
    !!initial.q ||
    (initial.category && initial.category.length > 0) ||
    (initial.date && initial.date !== 'all') ||
    (initial.price && initial.price !== 'all') ||
    (initial.sort && initial.sort !== 'soon');

  const handleReset = useCallback(() => {
    setQ('');
    startTransition(() => {
      router.push('/', { scroll: false });
    });
  }, [router, startTransition]);

  return (
    <div className="tb-card p-3 mb-6 flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Поиск по названию или описанию..."
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 pr-8"
          aria-label="Поиск событий"
        />
        {q && (
          <button
            type="button"
            onClick={() => handleSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Очистить поиск"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <Select
        defaultValue={initial.date ?? 'all'}
        onValueChange={(v) => pushParams({ date: v as string })}
      >
        <SelectTrigger aria-label="Фильтр по дате" className="w-auto min-w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={initial.price ?? 'all'}
        onValueChange={(v) => pushParams({ price: v as string })}
      >
        <SelectTrigger aria-label="Фильтр по цене" className="w-auto min-w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRICE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={initial.sort ?? 'soon'}
        onValueChange={(v) => pushParams({ sort: v as string })}
      >
        <SelectTrigger aria-label="Сортировка" className="w-auto min-w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          aria-label="Сбросить все фильтры"
        >
          <X className="size-3.5 mr-1" />
          Сбросить
        </Button>
      )}

      <div className="flex flex-wrap gap-1.5 w-full md:w-auto md:hidden">
        {CATEGORY_ENTRIES.map(([key, { label, emoji }]) => {
          const active = initial.category?.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleCategoryToggle(key)}
              className={`tb-badge text-xs cursor-pointer transition-colors ${active ? 'tb-badge-summer' : ''}`}
              aria-pressed={!!active}
              aria-label={`Категория ${label}`}
            >
              {emoji} {label}
            </button>
          );
        })}
      </div>

      <div className="hidden md:flex md:flex-wrap md:gap-1.5">
        {CATEGORY_ENTRIES.map(([key, { label, emoji }]) => {
          const active = initial.category?.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleCategoryToggle(key)}
              className={`tb-badge text-xs cursor-pointer transition-colors ${active ? 'tb-badge-summer' : ''}`}
              aria-pressed={!!active}
              aria-label={`Категория ${label}`}
            >
              {emoji} {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

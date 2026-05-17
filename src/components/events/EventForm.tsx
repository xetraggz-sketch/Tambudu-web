'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CATEGORIES } from '@/lib/categories';
import {
  createEventFormSchema,
  type CreateEventInput,
} from '@/lib/schemas/event';
import {
  createEventAction,
  type CreateEventState,
} from '@/app/(user)/create-event/actions';
import type { EventCategory } from '@/generated/prisma/client';

const categoryEntries = Object.entries(CATEGORIES) as [
  EventCategory,
  { label: string; emoji: string },
][];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <>
      {errors.map((e) => (
        <p key={e} className="text-destructive text-sm mt-1">{e}</p>
      ))}
    </>
  );
}

export function EventForm({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      address: '',
      priceRubles: 0,
      category: undefined,
      startsAt: undefined,
      endsAt: undefined,
      lat: undefined,
      lng: undefined,
      capacity: undefined,
    },
  });

  const categoryValue = watch('category');

  function onSubmit(data: CreateEventInput) {
    setServerError(undefined);
    startTransition(async () => {
      const result: CreateEventState = await createEventAction(data);
      if (result.ok) {
        toast.success('Событие отправлено на модерацию');
        router.push('/my-events');
        return;
      }
      if (result.error) {
        setServerError(result.error);
      }
    });
  }

  const submitting = isPending;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="title" className="font-medium text-[13px] text-foreground">
          Название
        </Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Лекция о современном искусстве"
          className="mt-1.5"
          disabled={disabled}
        />
        <FieldError errors={errors.title?.message ? [errors.title.message] : undefined} />
      </div>

      <div>
        <Label htmlFor="description" className="font-medium text-[13px] text-foreground">
          Описание
        </Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Расскажите о событии подробнее..."
          rows={5}
          className="mt-1.5"
          disabled={disabled}
        />
        <FieldError errors={errors.description?.message ? [errors.description.message] : undefined} />
      </div>

      <div>
        <Label className="font-medium text-[13px] text-foreground">
          Категория
        </Label>
        <Select
          value={categoryValue ?? undefined}
          onValueChange={(val) => {
            if (val) setValue('category', val as EventCategory, { shouldValidate: true });
          }}
          disabled={disabled}
        >
          <SelectTrigger className="mt-1.5 w-full" aria-label="Категория">
            <SelectValue placeholder="Выберите категорию" />
          </SelectTrigger>
          <SelectContent>
            {categoryEntries.map(([key, { label, emoji }]) => (
              <SelectItem key={key} value={key}>
                {emoji} {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError errors={errors.category?.message ? [errors.category.message] : undefined} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startsAt-date" className="font-medium text-[13px] text-foreground">
            Дата начала
          </Label>
          <Input
            id="startsAt-date"
            type="date"
            className="mt-1.5"
            disabled={disabled}
            onChange={(e) => {
              const timeEl = document.getElementById('startsAt-time') as HTMLInputElement | null;
              const time = timeEl?.value || '12:00';
              const val = e.target.value;
              if (val) {
                setValue('startsAt', new Date(`${val}T${time}`), { shouldValidate: true });
              }
            }}
          />
        </div>
        <div>
          <Label htmlFor="startsAt-time" className="font-medium text-[13px] text-foreground">
            Время начала
          </Label>
          <Input
            id="startsAt-time"
            type="time"
            defaultValue="12:00"
            className="mt-1.5"
            disabled={disabled}
            onChange={(e) => {
              const dateEl = document.getElementById('startsAt-date') as HTMLInputElement | null;
              const date = dateEl?.value;
              if (date) {
                setValue('startsAt', new Date(`${date}T${e.target.value}`), { shouldValidate: true });
              }
            }}
          />
        </div>
      </div>
      <FieldError errors={errors.startsAt?.message ? [errors.startsAt.message] : undefined} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="endsAt-date" className="font-medium text-[13px] text-foreground">
            Дата окончания
            <span className="text-muted-foreground ml-1">(необязательно)</span>
          </Label>
          <Input
            id="endsAt-date"
            type="date"
            className="mt-1.5"
            disabled={disabled}
            onChange={(e) => {
              const timeEl = document.getElementById('endsAt-time') as HTMLInputElement | null;
              const time = timeEl?.value || '14:00';
              const val = e.target.value;
              if (val) {
                setValue('endsAt', new Date(`${val}T${time}`), { shouldValidate: true });
              } else {
                setValue('endsAt', null, { shouldValidate: true });
              }
            }}
          />
        </div>
        <div>
          <Label htmlFor="endsAt-time" className="font-medium text-[13px] text-foreground">
            Время окончания
          </Label>
          <Input
            id="endsAt-time"
            type="time"
            defaultValue="14:00"
            className="mt-1.5"
            disabled={disabled}
            onChange={(e) => {
              const dateEl = document.getElementById('endsAt-date') as HTMLInputElement | null;
              const date = dateEl?.value;
              if (date) {
                setValue('endsAt', new Date(`${date}T${e.target.value}`), { shouldValidate: true });
              }
            }}
          />
        </div>
      </div>
      <FieldError errors={errors.endsAt?.message ? [errors.endsAt.message] : undefined} />

      <div>
        <Label htmlFor="address" className="font-medium text-[13px] text-foreground">
          Адрес
        </Label>
        <Input
          id="address"
          {...register('address')}
          placeholder="ул. Ленинградская, 56"
          className="mt-1.5"
          disabled={disabled}
        />
        <FieldError errors={errors.address?.message ? [errors.address.message] : undefined} />
      </div>

      <details className="rounded-xl border border-border p-4">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
          Точные координаты
        </summary>
        <p className="text-xs text-muted-foreground mt-2 mb-3">
          Открой OpenStreetMap, найди адрес, правый клик &rarr; Show address. Скопируй lat и lng.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lat" className="font-medium text-[13px] text-foreground">
              Широта (lat)
            </Label>
            <Input
              id="lat"
              type="number"
              step="any"
              {...register('lat', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
              placeholder="53.1959"
              className="mt-1.5"
              disabled={disabled}
            />
          </div>
          <div>
            <Label htmlFor="lng" className="font-medium text-[13px] text-foreground">
              Долгота (lng)
            </Label>
            <Input
              id="lng"
              type="number"
              step="any"
              {...register('lng', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
              placeholder="50.1002"
              className="mt-1.5"
              disabled={disabled}
            />
          </div>
        </div>
      </details>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priceRubles" className="font-medium text-[13px] text-foreground">
            Цена (в рублях)
          </Label>
          <Input
            id="priceRubles"
            type="number"
            step="0.01"
            min={0}
            {...register('priceRubles', { setValueAs: (v: string) => (v === '' ? 0 : Number(v)) })}
            placeholder="0"
            className="mt-1.5"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground mt-1">
            0 = бесплатное событие
          </p>
          <FieldError errors={errors.priceRubles?.message ? [errors.priceRubles.message] : undefined} />
        </div>
        <div>
          <Label htmlFor="capacity" className="font-medium text-[13px] text-foreground">
            Вместимость
            <span className="text-muted-foreground ml-1">(необязательно)</span>
          </Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            {...register('capacity', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
            placeholder="50"
            className="mt-1.5"
            disabled={disabled}
          />
          <FieldError errors={errors.capacity?.message ? [errors.capacity.message] : undefined} />
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Info className="size-3.5 shrink-0" />
          <span>Модератор рассмотрит в течение 24 часов</span>
        </div>
        <Button
          type="submit"
          disabled={disabled || submitting}
          className="w-full"
        >
          {submitting && <Loader2 className="animate-spin" />}
          {submitting ? 'Отправляем...' : 'Отправить на модерацию'}
        </Button>
      </div>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventCard, type EventCardData } from './EventCard';
import { EventsMapDynamic } from '@/components/map/EventsMapDynamic';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

type FeedEvent = EventCardData & { lat: number; lng: number };

export function FeedMapSplit({ events }: { events: FeedEvent[] }) {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const router = useRouter();

  if (events.length === 0) {
    return (
      <div className="tb-card p-8 text-center text-muted-foreground">
        <div className="text-4xl mb-3">🤷</div>
        <p className="text-lg mb-4">Ничего не нашли по этим фильтрам.</p>
        <Button
          variant="outline"
          onClick={() => router.push('/', { scroll: false })}
          aria-label="Сбросить фильтры"
        >
          Сбросить фильтры
        </Button>
      </div>
    );
  }

  const List = (
    <div className="flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: '70vh' }}>
      {events.map((e) => (
        <div
          key={e.id}
          onMouseEnter={() => setSelectedId(e.id)}
          onFocus={() => setSelectedId(e.id)}
          className="rounded-xl"
        >
          <EventCard event={e} selected={selectedId === e.id} />
        </div>
      ))}
    </div>
  );

  const Map = (
    <div className="rounded-xl overflow-hidden h-[70vh] sticky top-20">
      <EventsMapDynamic
        events={events.map((e) => ({
          id: e.id,
          lat: e.lat,
          lng: e.lng,
          title: e.title,
          category: e.category,
          isPromoted: e.isPromoted,
        }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </div>
  );

  return (
    <>
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        {List}
        {Map}
      </div>

      <div className="md:hidden">
        <Tabs defaultValue="list">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="list">Список</TabsTrigger>
            <TabsTrigger value="map">Карта</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-4">{List}</TabsContent>
          <TabsContent value="map" className="mt-4">
            <div className="h-[60vh] rounded-xl overflow-hidden">{Map}</div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

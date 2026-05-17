import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'О проекте — ТамБуду',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold mb-6">О проекте</h1>
      <p className="text-muted-foreground leading-relaxed mb-4">
        <strong className="text-foreground">ТамБуду</strong> — это городской
        агрегатор событий, придуманный для жителей Самары. Мы собираем лекции,
        мастер-классы, концерты, прогулки, кинопоказы во двориках и другие
        мероприятия в одном месте. Размещение событий бесплатное, без рекламы и
        без навязчивых рассылок.
      </p>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Идея простая: если в городе что-то происходит, об этом стоит узнать.
        Не через алгоритмы соцсетей и не через платные баннеры, а через честную
        ленту событий. Организатор создаёт событие, указывает дату, место и цену
        (или «бесплатно»), а участники записываются в один клик.
      </p>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Проект в стадии активной разработки. Минимальный фронтенд, тёплая
        дворовая атмосфера, никакого визуального шума. Если у вас есть идеи или
        вы хотите помочь — напишите нам. Мы верим, что городские события не
        должны теряться в информационном потоке.
      </p>
    </div>
  );
}

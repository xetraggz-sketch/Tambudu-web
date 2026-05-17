import Link from 'next/link';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'hello@tambudu.ru';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-8 px-4">
      <div className="grid md:grid-cols-3 gap-6 max-w-screen-2xl mx-auto">
        <div>
          <p className="font-display text-lg font-semibold">ТамБуду</p>
          <p className="text-muted-foreground text-sm mt-1">
            События в Самаре. Бесплатные и платные.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
            О проекте
          </Link>
          <Link href="/rules" className="text-muted-foreground hover:text-foreground transition-colors">
            Правила
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-muted-foreground hover:text-foreground transition-colors">
            Связаться
          </a>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Email: {SUPPORT_EMAIL}</p>
          <p className="mt-1">Самара, Россия</p>
        </div>
      </div>
      <div className="border-t border-border mt-6 pt-4 text-xs text-muted-foreground text-center max-w-screen-2xl mx-auto">
        &copy; ТамБуду 2026
      </div>
    </footer>
  );
}

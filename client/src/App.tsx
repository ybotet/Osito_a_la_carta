import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock3, CookingPot, Heart, MapPin, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { fetchDishes } from './api/dishes';
import DishCard from './components/DishCard';
import { Button } from './components/ui/button';

type ValueCard = {
  icon: typeof CookingPot;
  titleKey: string;
  textKey: string;
};

type StepCard = {
  number: string;
  titleKey: string;
  textKey: string;
};

const App = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['dishes', language],
    queryFn: ({ signal }) => fetchDishes(language, signal),
  });

  const featuredDishes = data?.dishes.slice(0, 3) ?? [];

  const valueCards: ValueCard[] = [
    { icon: CookingPot, titleKey: 'home.valueCookingTitle', textKey: 'home.valueCookingText' },
    { icon: Heart, titleKey: 'home.valueCareTitle', textKey: 'home.valueCareText' },
    { icon: Truck, titleKey: 'home.valueDeliveryTitle', textKey: 'home.valueDeliveryText' },
  ];

  const steps: StepCard[] = [
    { number: '01', titleKey: 'home.stepOneTitle', textKey: 'home.stepOneText' },
    { number: '02', titleKey: 'home.stepTwoTitle', textKey: 'home.stepTwoText' },
    { number: '03', titleKey: 'home.stepThreeTitle', textKey: 'home.stepThreeText' },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-8 sm:px-6 lg:gap-24 lg:py-12">
      <section className="grid gap-10 overflow-hidden rounded-3xl border bg-muted/40 p-6 sm:p-10 md:grid-cols-2 md:items-center lg:p-14">
        <div className="flex flex-col items-start gap-6">
          <p className="rounded-full border bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
            {t('home.eyebrow')}
          </p>
          <div className="flex flex-col gap-4">
            <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t('home.title')}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              {t('home.intro')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/menu">
                {t('home.menuCta')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#about">{t('home.storyCta')}</a>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto flex min-h-72 w-full max-w-md items-center justify-center rounded-[2rem] bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 p-8 dark:from-stone-800 dark:via-stone-800 dark:to-amber-950 sm:min-h-96">
          <div className="absolute left-5 top-5 rounded-2xl border bg-background/90 p-3 shadow-sm sm:left-8 sm:top-8">
            <Heart className="h-5 w-5 text-rose-600" aria-hidden="true" />
          </div>
          <img
            src="/images/osito.jpg"
            alt=""
            aria-hidden="true"
            className="h-48 w-48 rounded-full object-cover shadow-xl ring-8 ring-background/70 sm:h-64 sm:w-64"
          />
          <p className="absolute bottom-5 right-5 max-w-44 rounded-2xl border bg-background/95 px-4 py-3 text-sm font-semibold shadow-sm sm:bottom-8 sm:right-8">
            {t('home.heroBadge')}
          </p>
        </div>
      </section>

      <section aria-labelledby="featured-title" className="flex flex-col gap-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('home.featuredEyebrow')}
            </p>
            <h2 id="featured-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('home.featuredTitle')}
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link to="/menu">{t('home.allDishes')}</Link>
          </Button>
        </div>

        {isPending ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <li
                key={index}
                className="h-80 animate-pulse rounded-xl border bg-muted/60"
                aria-hidden="true"
              />
            ))}
          </ul>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
            <p role="alert" className="text-sm text-muted-foreground">
              {t('home.featuredError')}
            </p>
            <Button variant="outline" onClick={() => void refetch()}>
              {t('home.retry')}
            </Button>
          </div>
        ) : featuredDishes.length === 0 ? (
          <p className="rounded-xl border bg-muted/40 p-5 text-muted-foreground">
            {t('home.noFeatured')}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDishes.map((dish) => (
              <li key={dish.id} className="h-full">
                <DishCard dish={dish} language={language} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label={t('home.valuesLabel')} className="grid gap-4 md:grid-cols-3">
        {valueCards.map(({ icon: Icon, titleKey, textKey }) => (
          <article key={titleKey} className="flex gap-4 rounded-2xl border bg-card p-5 sm:p-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold">{t(titleKey)}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(textKey)}</p>
            </div>
          </article>
        ))}
      </section>

      <section
        id="about"
        className="grid gap-8 rounded-3xl bg-muted/40 p-6 sm:p-10 md:grid-cols-2 md:items-center lg:p-12"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('home.aboutEyebrow')}
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('home.aboutTitle')}</h2>
          <p className="leading-relaxed text-muted-foreground">{t('home.aboutText')}</p>
        </div>
        <ul className="flex flex-col gap-4">
          <li className="flex gap-3 rounded-xl border bg-background p-4">
            <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{t('home.aboutPointOne')}</span>
          </li>
          <li className="flex gap-3 rounded-xl border bg-background p-4">
            <CookingPot className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{t('home.aboutPointTwo')}</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="how-title" className="flex flex-col gap-7">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('home.howEyebrow')}
          </p>
          <h2 id="how-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('home.howTitle')}
          </h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(({ number, titleKey, textKey }) => (
            <li key={number} className="rounded-2xl border bg-card p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {number}
              </span>
              <h3 className="mb-2 font-semibold">{t(titleKey)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(textKey)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 rounded-3xl border p-6 sm:p-10 md:grid-cols-2 md:items-center lg:p-12">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('home.visitEyebrow')}
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('home.visitTitle')}</h2>
          <p className="leading-relaxed text-muted-foreground">{t('home.visitText')}</p>
          <Button asChild className="w-fit">
            <Link to="/menu">
              {t('home.menuCta')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-muted/60 p-5">
            <dt className="mb-3 flex items-center gap-2 font-semibold">
              <MapPin className="h-5 w-5" aria-hidden="true" />
              {t('home.locationLabel')}
            </dt>
            <dd className="text-sm text-muted-foreground">{t('home.location')}</dd>
          </div>
          <div className="rounded-2xl bg-muted/60 p-5">
            <dt className="mb-3 flex items-center gap-2 font-semibold">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
              {t('home.hoursLabel')}
            </dt>
            <dd className="text-sm text-muted-foreground">{t('home.hours')}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
};

export default App;

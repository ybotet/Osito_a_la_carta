import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchDishes } from '../api/dishes';
import type { ApiDish } from '../api/dishes.types';

/**
 * skeletons del estado de carga: mismo hueco que la tarjeta final, sin texto. Se pintan
 * para que la página no dé un salto de tamaño al llegar los datos.
 */
const DishSkeleton = () => (
  <li className="flex flex-col gap-2 rounded-lg border border-stone-200 p-4">
    <div className="h-32 animate-pulse rounded bg-stone-200" />
    <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
    <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200" />
  </li>
);

const DISH_SKELETONS = 4;

/**
 * El precio se formatea con `Intl.NumberFormat` en el idioma de la petición. No se
 * construye a mano con `toFixed`: el separador decimal y de miles cambian entre idiomas
 * (`11,90` en español, `11.90` en inglés, `11,90` en ruso) y el precio llega ya en el
 * idioma del usuario, así que formatearlo en otro daría un número que no encaja con el
 * resto de la pantalla.
 */
const formatPrice = (price: number, language: string) =>
  new Intl.NumberFormat(language, {
    style: 'currency',
    currency: 'EUR',
  }).format(price);

const DishCard = ({ dish, language }: { dish: ApiDish; language: string }) => (
  <li className="flex flex-col gap-2 rounded-lg border border-stone-200 p-4">
    <img
      src={dish.imageUrl}
      alt={dish.name}
      loading="lazy"
      className="h-32 w-full rounded object-cover"
    />
    <h2 className="text-lg font-semibold">{dish.name}</h2>
    <p className="text-sm text-stone-600">{dish.description}</p>
    <p className="text-sm text-stone-500">{dish.ingredients}</p>
    <p className="mt-auto text-base font-semibold">
      {formatPrice(dish.price, language)}
    </p>
  </li>
);

/**
 * Página del menú. Los cuatro estados que pide el enunciado se distinguen por el orden en
 * que se comprueban: primero la carga, luego el error, y solo si no hay ninguno el
 * resultado vacío. Invertir el orden de error y carga muestra el error de la petición
 * anterior mientras se está pidiendo la siguiente.
 */
const Menu = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  /**
   * `language` va en la `queryKey` a propósito: si no, al cambiar de idioma TanStack
   * devolvería la caché de la petición anterior y la pantalla quedaría en el idioma
   * viejo hasta que se recargara. Con el idioma en la clave, cada idioma tiene su entrada
   * y volver al anterior no vuelve a pedir nada.
   */
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['dishes', language],
    queryFn: ({ signal }) => fetchDishes(language, signal),
  });

  if (isPending) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <h1 className="mb-4 text-3xl font-bold">{t('menu.title')}</h1>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: DISH_SKELETONS }, (_, index) => (
            <DishSkeleton key={index} />
          ))}
        </ul>
        <p className="sr-only" role="status">
          {t('menu.loading')}
        </p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <h1 className="mb-4 text-3xl font-bold">{t('menu.title')}</h1>
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-4 text-red-800"
        >
          {t('menu.error')}
        </p>
        {error instanceof Error ? (
          <p className="mt-2 text-xs text-stone-500">{error.message}</p>
        ) : null}
      </main>
    );
  }

  const dishes = data?.dishes ?? [];

  if (dishes.length === 0) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <h1 className="mb-4 text-3xl font-bold">{t('menu.title')}</h1>
        <p className="text-stone-600">{t('menu.empty')}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-3xl font-bold">{t('menu.title')}</h1>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dishes.map((dish) => (
          <DishCard key={dish.id} dish={dish} language={language} />
        ))}
      </ul>
    </main>
  );
};

export default Menu;

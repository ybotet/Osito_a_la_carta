import type { ApiDish } from '../api/dishes.types';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../lib/format';
import { Button } from './ui/button';

/**
 * Tarjeta de un plato.
 *
 * **El componente no pide nada ni conoce la API**: recibe el plato ya localizado y solo lo
 * pinta. Eso lo hace reutilizable desde la página del menú, desde un detalle y desde
 * cualquier futuro listado, y es lo que permite probarlo sin red.
 *
 * `language` llega como prop en vez de leer `i18n` aquí, por el mismo motivo que en
 * `fetchDishes`: quien llama ya lo tiene y así el componente no depende del singleton.
 */
type DishCardProps = {
  dish: ApiDish;
  language: string;
};

const DishCard = ({ dish, language }: DishCardProps) => {
  const { t } = useTranslation();

  return (
    <article className="flex h-full flex-col gap-2 rounded-lg border border-stone-200 p-4">
      <img
        src={dish.imageUrl}
        alt={dish.name}
        loading="lazy"
        // `aspect-[4/3]` fija la proporción para que todas las imágenes ocupen lo mismo y la
        // fila no baile al cargar. `object-cover` recorta en vez de deformar: la URL del
        // seed es un placeholder de 600x400 (3:2), así que sin esto se estiraría.
        className="aspect-[4/3] w-full rounded object-cover"
      />

      <h2 className="text-lg font-semibold">{dish.name}</h2>

      {/*
        `line-clamp-2` corta la descripción a dos líneas con puntos suspensivos. Se usa en
        lugar de un `truncate` con altura fija porque el texto llega ya localizado y su
        longitud cambia con el idioma: un `truncate` por anchura da entre una y tres líneas
        según el texto y las tarjetas quedarían con alturas distintas.
      */}
      <p className="line-clamp-2 text-sm text-gray-600">{dish.description}</p>

      <p className="text-xs text-gray-500">{dish.ingredients}</p>

      <p className="mt-auto text-xl font-bold">
        {formatPrice(dish.price, language)}
      </p>

      <Button className="w-full">{t('cart.add')}</Button>
    </article>
  );
};

export default DishCard;
export type { DishCardProps };

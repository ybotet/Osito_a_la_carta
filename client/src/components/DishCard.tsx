import { Link } from 'react-router-dom';
import type { ApiDish } from '../api/dishes.types';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../lib/format';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';

/**
 * Tarjeta de un plato.
 *
 * **El componente no pide nada ni conoce la API**: recibe el plato ya localizado y solo lo
 * pinta. Eso lo hace reutilizable desde la página del menú, desde un detalle y desde
 * cualquier futuro listado, y es lo que permite probarlo sin red.
 *
 * `language` llega como prop en vez de leer `i18n` aquí, por el mismo motivo que en
 * `fetchDishes`: quien llama ya lo tiene y así el componente no depende del singleton.
 *
 * **El aspecto lo pone `Card` de shadcn y el contenido va en sus huecos** (`CardHeader` con la
 * imagen y el nombre, `CardContent` con la descripción, `CardFooter` con el precio y el botón).
 * El `p-6` de los huecos es el que sustituye al `p-4` que tenía la tarjeta antes: el espaciado
 * deja de estar puesto a mano en cada sitio y pasa a ser el del componente.
 *
 * **El `<article>` sigue siendo el elemento raíz, por fuera del `Card`.** `Card` renderiza un
 * `div` y no admite `asChild`, así que usar `Card` como raíz habría cambiado un `<article>` (que
 * T-032 eligió a propósito) por un `div` sin ganar nada: el estilo lo aporta el `Card` de dentro
 * y el `<li>` lo pone la lista. Con las dos cosas, ni la semántica ni el aspecto se pierden.
 *
 * **La imagen y el nombre enlazan al detalle** (`/menu/:id`). Se enlazan esos dos y no toda la
 * tarjeta porque la tarjeta contiene un `<button>`: un `<a>` no puede envolver un `<button>` (no
 * se anudan elementos interactivos, y además dejarían de funcionar el teclado y el lector de
 * pantalla). Poner el enlace en la imagen y en el título agranda la zona pulsable sin inventarse
 * un `stretched-link`.
 */
type DishCardProps = {
  dish: ApiDish;
  language: string;
};

const DishCard = ({ dish, language }: DishCardProps) => {
  const { t } = useTranslation();
  const detailPath = `/menu/${dish.id}`;

  return (
    <article className="h-full">
      <Card className="flex h-full flex-col">
        <CardHeader className="gap-2">
          {/*
            El enlace envuelve a la imagen y es el `<a>` el elemento enfocable por teclado; la
            imagen es su contenido. Poner el enlace dentro del `<img>` no es posible y dejar el
            nombre solo como enlace reduciría la zona pulsable a una línea de texto.
          */}
          <Link to={detailPath} className="block">
            <img
              src={dish.imageUrl}
              alt={dish.name}
              loading="lazy"
              // `aspect-[4/3]` fija la proporción para que todas las imágenes ocupen lo mismo
              // y la fila no baile al cargar. `object-cover` recorta en vez de deformar: la URL
              // del seed es un placeholder de 600x400 (3:2), así que sin esto se estiraría.
              className="aspect-[4/3] w-full rounded object-cover"
            />
          </Link>

          {/*
            `CardTitle` es un `div`, así que el `<h2>` va dentro: el div aporta el estilo y el
            encabezado la semántica. `leading-snug` porque `CardTitle` trae `leading-none`, que
            con el nombre más largo del menú en dos líneas deja el texto demasiado apretado.
          */}
          <CardTitle className="leading-snug text-lg">
            <h2>
              <Link to={detailPath} className="hover:underline">
                {dish.name}
              </Link>
            </h2>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-2">
          {/*
            `line-clamp-2` corta la descripción a dos líneas con puntos suspensivos. Se usa en
            lugar de un `truncate` con altura fija porque el texto llega ya localizado y su
            longitud cambia con el idioma: un `truncate` por anchura da entre una y tres líneas
            según el texto y las tarjetas quedarían con alturas distintas.
          */}
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {dish.description}
          </p>
          <p className="text-xs text-muted-foreground">{dish.ingredients}</p>
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-3">
          <p className="text-xl font-bold">
            {formatPrice(dish.price, language)}
          </p>
          <Button>{t('cart.add')}</Button>
        </CardFooter>
      </Card>
    </article>
  );
};

export default DishCard;
export type { DishCardProps };

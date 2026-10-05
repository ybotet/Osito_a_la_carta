import { Link } from 'react-router-dom';
import type { ApiDish } from '../api/dishes.types';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../lib/format';
import { useCartStore } from '../store/cart';
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
 *
 * **El botón de añadir se conecta al store en T-050** y pasa a enseñar cuántas unidades hay de
 * ese plato. Antes no hacía nada y se dejó así a propósito (era el gancho que T-032 dejó
 * preparado). La cantidad se lee del store en la propia tarjeta y no del carrito: la página del
 * carrito (T-053) todavía no existe, así que **el número al lado del botón es la única señal de
 * que el clic hizo algo**. Un botón que reacciona a un clic sin cambiar nada en la pantalla deja
 * al usuario sin saber si falló o si no se registró.
 */
type DishCardProps = {
  dish: ApiDish;
  language: string;
};

const DishCard = ({ dish, language }: DishCardProps) => {
  const { t } = useTranslation();
  const addItem = useCartStore((state) => state.addItem);
  const quantity = useCartStore(
    (state) =>
      state.items.find((item) => item.dishId === dish.id)?.quantity ?? 0,
  );
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
          {/*
            `variant="outline"` cuando el plato ya está en el carrito: el botón cambia de
            aspecto para marcar que es una acción de "añadir otra vez", no de "empezar a
            añadir". El número va dentro del botón y no como texto al lado para que el botón no
            cambie de ancho al pasar de 0 a 1, que haría bailar la fila del menú.

            `aria-label` con la cantidad para el lector de pantalla: el número dentro de un
            `<button>` no se anuncia con contexto, y sin esto un usuario de lector oye
            "Añadir al carrito" y no oye que ya hay tres.
          */}
          <Button
            variant={quantity > 0 ? 'outline' : 'default'}
            onClick={() => addItem(dish)}
            aria-label={
              quantity > 0 ? `${t('cart.add')} (${quantity})` : undefined
            }
          >
            {t('cart.add')}
            {quantity > 0 && (
              <span
                className="rounded bg-muted px-1.5 text-xs font-semibold text-muted-foreground"
                aria-hidden="true"
              >
                {quantity}
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </article>
  );
};

export default DishCard;
export type { DishCardProps };

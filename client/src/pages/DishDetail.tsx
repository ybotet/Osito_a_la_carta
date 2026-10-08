import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiError } from '../api/http';
import { fetchDishById } from '../api/dishes';
import { recordPageView } from '../api/stats';
import { formatPrice } from '../lib/format';
import { useCartStore } from '../store/cart';
import { Button } from '../components/ui/button';

/**
 * Página de detalle de un plato (`/menu/:id`).
 *
 * **Es una página y no una segunda versión de `DishCard`.** La tarjeta vive dentro de un `<li>`
 * de una lista y es un resumen; el detalle necesita hueco para una imagen grande y para el texto
 * completo sin truncar. Si compartieran componente, la tarjeta tendría que admitir "a pantalla
 * completa y sin recortes", y con eso cada consumidor tendría que inventarse su propio criterio
 * para decidir cuál de las dos formas quiere.
 *
 * **Pide el plato por su cuenta en vez de sacarlo de la caché del listado.** La caché del menú
 * puede tener el plato de hace más de `staleTime`, o no tenerlo si el usuario entra por la URL.
 * La clave lleva el idioma, como la del listado en T-031: sin él, al cambiar de idioma se
 * serviría la traducción anterior.
 *
 * **El botón de "añadir al carrito" no hace nada todavía.** No hay carrito detrás; llega con
 * T-050. Por eso no se le pasa `onClick`, igual que en `DishCard`.
 */

/**
 * Esqueleto de carga. Ocupa el mismo hueco que el detalle real (imagen 4:3 a la izquierda,
 * bloques de texto a la derecha) para que la página no dé un salto de tamaño al llegar el dato.
 *
 * Los bloques no llevan texto para que no se lea un "cargando" parpadeando, pero sí hay un
 * `role="status"` oculto al lector de pantalla: sin él, la carga de esta página sería un
 * silencio total y no se distinguiría de una página vacía.
 */
const DishDetailSkeleton = () => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-5xl p-4">
      <p className="sr-only" role="status">
        {t('dish.loading')}
      </p>
      <div className="mb-4 h-8 w-40 animate-pulse rounded bg-stone-200" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-stone-200" />
        <div className="flex flex-col gap-4">
          <div className="h-5 w-3/4 animate-pulse rounded bg-stone-200" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-stone-200" />
          <div className="h-9 w-28 animate-pulse rounded bg-stone-200" />
        </div>
      </div>
    </main>
  );
};

type DishDetailErrorProps = {
  isNotFound: boolean;
  /**
   * El mensaje crudo de la API solo se enseña cuando viene de ella: es texto técnico en inglés
   * que ayuda a diagnosticar y estorba al usuario. En el caso de un `id` inválido no hay ningún
   * error de API que enseñar, y sin este prop opcional habría que inventar uno.
   */
  message?: string;
};

/**
 * Estado de error, con salida de vuelta al menú para que el usuario no quede atrapado en una
 * página que no va a cargar nunca.
 *
 * **Un 404 del backend no siempre es "no existe".** `DISH_NOT_FOUND` también sale cuando el
 * plato está deshabilitado, y es la decisión de T-021 no revelar qué platos existieron, así
 * que los dos casos comparten mensaje. Cualquier otro error es un fallo de la API y merece otro
 * texto, o el usuario creería que el plato se le ha borrado.
 */
const DishDetailError = ({ isNotFound, message }: DishDetailErrorProps) => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-5xl p-4">
      <p
        role="alert"
        className="rounded border border-red-300 bg-red-50 p-4 text-red-800"
      >
        {isNotFound ? t('dish.notFound') : t('dish.error')}
      </p>
      {message !== undefined ? (
        <p className="mt-2 text-xs text-muted-foreground">{message}</p>
      ) : null}
      {/*
        `Button` con `asChild` y un `Link` dentro. Esto era un `Link` con
        `buttonVariants({ variant: 'outline' })`, el apaño que dejó T-034 porque el `Button`
        que había no tenía `asChild`. Con el componente oficial, `asChild` lo resuelve sin
        copiar las clases a mano, que es justo para lo que existe.
      */}
      <Button asChild variant="outline" className="mt-4">
        <Link to="/menu">{t('nav.backToMenu')}</Link>
      </Button>
    </main>
  );
};

const DishDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const dishId = Number(id);

  /**
   * El botón de añadir se conecta al store en T-050. Los hooks van aquí arriba y no junto al
   * botón, porque la página tiene tres salidas tempranas (`isPending`, `isError` y el `dish`
   * indefinido) y un hook debajo de un `return` no se ejecutaría en el primer render y sí en
   * los siguientes: es la forma de romper las reglas de los hooks sin que salte ningún aviso.
   *
   * La cantidad sale de `dishId`, que ya está resuelto a número aquí, así que en la ruta
   * inválida la línea del carrito que se busca no existe y sale 0, que es lo que toca.
   */
  const addItem = useCartStore((state) => state.addItem);
  const quantity = useCartStore(
    (state) =>
      state.items.find((item) => item.dishId === dishId)?.quantity ?? 0,
  );

  /**
   * El `id` de la ruta es una cadena y puede ser cualquier cosa: `/menu/abc` no es un plato. Se
   * descarta antes de preguntar en vez de mandar `NaN` al backend y enseñarle al usuario el
   * error de la API por una URL que ya se sabe inválida. Es la misma regla que aplica
   * `idParamSchema` en el servidor.
   */
  const isValidId = Number.isInteger(dishId) && dishId > 0;

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['dish', dishId, language],
    queryFn: ({ signal }) => fetchDishById(dishId, language, signal),
    enabled: isValidId,
  });

  // Registrar pageview al cargar el plato (T-070)
  // Se ejecuta solo cuando hay datos válidos; useEffect se llama en cada render
  // pero el callback solo hace algo si `dish` existe
  useEffect(() => {
    const dish = data?.dish;
    if (dish) {
      recordPageView(dish.id, `/menu/${dish.id}`).catch((err) => {
        // Silencioso: no bloquear la UI si falla el registro de estadísticas
        console.debug('Pageview recording failed:', err);
      });
    }
  }, [data?.dish]);

  if (!isValidId) {
    return <DishDetailError isNotFound />;
  }

  if (isPending) {
    return <DishDetailSkeleton />;
  }

  if (isError) {
    return (
      <DishDetailError
        isNotFound={
          error instanceof ApiError && error.code === 'DISH_NOT_FOUND'
        }
        message={error.message}
      />
    );
  }

  /**
   * Rama defensiva: si no hay error y no está cargando, `data` existe. Se comprueba igualmente
   * porque `useQuery` devuelve `data` como opcional y sin esto el acceso a `data.dish` no
   * compila; sin dato no se pinta una tarjeta a medias, se repite el esqueleto.
   */
  const dish = data?.dish;

  if (dish === undefined) {
    return <DishDetailSkeleton />;
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{dish.name}</h1>
        {/*
          `Button` con `asChild` y un `Link` dentro: un `<button>` no puede contener un
          enlace, y `asChild` es lo que permite tener las dos cosas sin copiar las clases del
          botón en cada enlace.
        */}
        <Button asChild variant="outline">
          <Link to="/menu">{t('nav.backToMenu')}</Link>
        </Button>
      </div>

      {/*
        Una columna en móvil y dos a partir de `md`. La imagen conserva la proporción 4:3 de la
        tarjeta del menú, para que el bloque tenga la altura que espera el ojo en lugar de una
        arbitraria, y `object-cover` para que una foto que no sea 4:3 se recorte en vez de
        deformarse.
      */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <img
          src={dish.imageUrl}
          alt={dish.name}
          className="aspect-[4/3] w-full rounded-lg object-cover"
        />

        <div className="flex flex-col gap-4">
          {/*
            Aquí la descripción **no** lleva `line-clamp-2`, al revés que en la tarjeta: en el
            detalle el texto completo es el objetivo y la tarjeta es la que resume.
          */}
          <p className="text-stone-700">{dish.description}</p>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              {t('dish.ingredients')}
            </h2>
            <p className="mt-1 text-sm text-stone-700">{dish.ingredients}</p>
          </section>

          <p className="text-2xl font-bold">
            {formatPrice(dish.price, language)}
          </p>

          {/*
            Igual que en `DishCard`: `outline` cuando el plato ya está en el carrito, el número
            dentro del botón (para que no cambie de ancho) y el `aria-label` para que el lector
            de pantalla anuncie la cantidad. El botón es de ancho completo en móvil porque es el
            que queda debajo de todo el texto del plato.
          */}
          <Button
            className="w-full sm:w-auto"
            variant={quantity > 0 ? 'outline' : 'default'}
            onClick={() => {
              if (dish !== undefined) {
                addItem(dish);
              }
            }}
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
        </div>
      </div>
    </main>
  );
};

export default DishDetail;

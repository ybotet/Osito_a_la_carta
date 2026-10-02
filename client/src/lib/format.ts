/**
 * Formatea un precio con la moneda y el idioma correctos.
 *
 * **Exige un idioma no vacío.** `Intl.NumberFormat` lanza `RangeError` con `''` o con un
 * identificador que no sea BCP-47 válido, y eso dejaría la página en blanco. Quien llama tiene
 * que pasar un idioma ya resuelto, que es lo que devuelve `i18n.resolvedLanguage`. No se pone
 * un idioma por defecto a propósito: si el fallo llegara hasta aquí, un valor por defecto
 * taparía el síntoma en lugar de delatarlo.
 *
 * Vive en `lib` y no junto al componente porque **es una función, no un componente**, y un
 * fichero que exporta las dos cosas rompe el Fast Refresh: al guardar, Vite recarga el
 * módulo entero en vez de refrescar solo el componente, y se pierde el estado del resto de la
 * pantalla.
 *
 * Se usa `Intl.NumberFormat` y no `toFixed` porque el separador cambia entre idiomas
 * (`11,90 €` en español, `11.90 €` en inglés) y el precio llega ya localizado por el
 * backend: formatearlo en otro idioma daría un número descuadrado con el resto.
 *
 * La moneda es EUR porque es la del menú. Si algún producto tuviera otra, el parámetro
 * `currency` se pasa desde quien llama, que ya es quien lo sabe.
 */
const formatPrice = (
  price: number,
  language: string,
  currency = 'EUR',
): string =>
  new Intl.NumberFormat(language, { style: 'currency', currency }).format(
    price,
  );

export { formatPrice };

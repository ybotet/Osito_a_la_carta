import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Helper de clases que usa shadcn/ui. Son dos cosas encadenadas y por eso no falta
 * ninguna de las dos:
 *
 * - `clsx` aplana condicionales, arrays y objetos en una sola cadena. Evita tener que
 *   montar el `className` con plantillas literales y `&&` a lo largo de todo el proyecto.
 * - `tailwind-merge` resuelve **conflictos reales de Tailwind**: si llegan
 *   `p-2` y `p-4`, en una cadena normal los dos existen y gana el que aparece después por
 *   orden del CSS, no por orden del código. Aquí el último gana siempre, así que un
 *   componente puede fijar `px-6` y quien lo use puede pasarle `px-2` sin pelearse con él.
 *
 * Sin `tailwind-merge`, sobrescribir una utilidad desde fuera del componente no funciona de
 * forma fiable, que es justo lo que necesita cualquier librería de componentes.
 */
const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export { cn };

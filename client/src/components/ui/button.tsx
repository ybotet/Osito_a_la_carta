import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

/**
 * Variantes del botón. Se declaran con `cva` en vez de con un `switch` porque el resultado
 * es una clase por variante y `cva` las compila todas en un objeto: añadir una variante es
 * una línea y no un caso más del `switch`. `cva` es lo que usa shadcn/ui de verdad.
 *
 * Los colores van como clases de Tailwind directamente, sin tokens del tema, para que el
 * botón no dependa de que alguien haya configurado `index.css` antes.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-stone-900 text-stone-50 hover:bg-stone-800',
        outline:
          'border border-stone-300 bg-transparent text-stone-900 hover:bg-stone-100',
        ghost: 'bg-transparent text-stone-900 hover:bg-stone-100',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

/**
 * Botón base de shadcn/ui. Extiende `ButtonHTMLAttributes` para que acepte `type`, `disabled`,
 * `onClick`, `aria-*` y todo lo demás de un `<button>` nativo: un componente que solo
 * acepta `variant` obligaría a quien lo use a reinventar el manejo de `disabled` o de
 * `onClick`.
 *
 * **No reimplementa el `<button>`**: no añade estilos inline ni manejadores propios, solo
 * clases. Así el comportamiento nativo (tecla Enter, foco, formulario) se conserva.
 */
/**
 * `buttonVariants` **no se exporta** mientras nadie lo necesite: un fichero que exporta
 * componentes y además funciones o constantes rompe el Fast Refresh, porque Vite deja de
 * poder refrescar solo el componente y recarga el módulo entero. Cuando haga falta
 * reutilizar las variantes (por ejemplo, para dar el mismo aspecto a un `<a>`), se extraen
 * a `button-variants.ts` en vez de exportarlas desde aquí.
 */
const Button = ({ className, variant, size, type, ...props }: ButtonProps) => (
  <button
    // `type="button"` por defecto: un `<button>` sin `type` dentro de un `<form>` es
    // `submit`, y un botón de "añadir al carrito" acabaría enviando el formulario entero.
    type={type ?? 'button'}
    className={cn(buttonVariants({ variant, size }), className)}
    {...props}
  />
);

export { Button };
export type { ButtonProps };

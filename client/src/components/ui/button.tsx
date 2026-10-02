import type { VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { buttonVariants } from './button-variants';

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
 *
 * `buttonVariants` está en `button-variants.ts` y **no se reexporta desde aquí**: un fichero que
 * exporta componentes y además funciones rompe el Fast Refresh. Quien necesite las clases sin
 * renderizar un `<button>` importa de ese fichero.
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

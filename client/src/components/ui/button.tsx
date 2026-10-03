import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

/**
 * `type` y no `interface`: es la convención de AGENTE.md §2.3, y el registro de shadcn usa
 * `interface`. La diferencia práctica es ninguna; el motivo de tocarlo es que el resto del
 * proyecto no usa `interface` y tener las dos en el mismo fichero se nota.
 */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /**
     * Pide que se renderice el hijo en vez de un `<button>`, conservando las clases. Es lo que
     * permite que un `<Link>` de navegación tenga el aspecto de un botón sin anidar un enlace
     * dentro de un `<button>`, que es HTML inválido.
     */
    asChild?: boolean;
  };

/**
 * Botón de shadcn/ui. El de verdad esta vez: `Slot` de Radix y las variantes del registro.
 *
 * **Un retoque sobre el original: `type="button"` por defecto.** El registro no lo pone, y un
 * `<button>` sin `type` dentro de un `<form>` es `submit`: el "añadir al carrito" acabaría
 * mandando el formulario entero. Es la razón que dejó anotada T-032 y no se pierde al cambiar al
 * componente oficial. Con `asChild` **no** se aplica, porque el hijo puede ser un `<a>` y un
 * `type="button"` en un enlace no significa nada (y sería HTML inválido); quien envuelve un
 * `<button>` real dentro de un formulario lo dice explícito.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        type={asChild ? type : (type ?? 'button')}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

/**
 * `buttonVariants` **no se exporta**, aunque el registro de shadcn lo exporte. Nadie lo usa
 * (era el `button-variants.ts` de T-032, que esta tarea borra) y exportarlo desde un fichero
 * que además exporta un componente rompe el fast refresh: ESLint avisa con
 * `react-refresh/only-export-components`. Se queda dentro del módulo, que es donde lo necesitan
 * `Button` y su tipo.
 */
export { Button };
export type { ButtonProps };

import { cva } from 'class-variance-authority';

/**
 * Variantes del botón, en su propio fichero para que las pueda usar también quien **no** va a
 * renderizar un `<button>`.
 *
 * **Vive aquí y no se exporta desde `button.tsx` por dos razones.** La primera es el Fast
 * Refresh: un fichero que exporta un componente y además funciones o constantes hace que Vite
 * deje de poder refrescar solo el componente y recargue el módulo entero, perdiendo el estado
 * del resto de la pantalla, y ESLint lo avisa con `react-refresh/only-export-components`. La
 * segunda es que hace falta de verdad: un `<Link>` de navegación **no puede** ir dentro de un
 * `<button>` (no se anidan interactivos) y este `Button` no admite `asChild` como el de shadcn
 * oficial, así que la única forma de que un enlace tenga exactamente el mismo aspecto que un
 * botón es compartir las variantes.
 *
 * Se declaran con `cva` y no con un `switch` porque el resultado es una clase por variante y
 * `cva` las compila todas en un objeto: añadir una variante es una línea y no un caso más.
 *
 * Los colores van como clases de Tailwind directamente, sin tokens del tema, porque el botón no
 * debe depender de que alguien haya configurado `index.css` antes. `index.css` hoy solo tiene
 * `@import 'tailwindcss'`; los tokens del tema son cosa de T-035.
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

export { buttonVariants };

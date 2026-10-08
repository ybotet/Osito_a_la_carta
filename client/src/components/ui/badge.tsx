import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge simple estilo shadcn/ui.
 * No usa Radix, solo es un span con variantes de color.
 */
const badgeVariants = {
  default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  secondary:
    'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive:
    'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
  outline: 'text-foreground',
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof badgeVariants;
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          badgeVariants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };
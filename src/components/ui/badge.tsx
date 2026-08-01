import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold', {
  variants: {
    variant: {
      // text-primary sobre bg-primary-soft mede só 4.56:1 (quase no limite da WCAG AA
      // pra texto pequeno) — usa um verde mais escuro dedicado só aqui, com folga.
      default: 'bg-primary-soft text-[#3b4e37]',
      secondary: 'bg-secondary-soft text-secondary',
      warn: 'bg-warn-soft text-warn',
      destructive: 'bg-danger-soft text-danger',
      info: 'bg-info-soft text-info',
      outline: 'border border-line text-inksoft',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

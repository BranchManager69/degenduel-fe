import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const progressVariants = cva(
  'relative w-full overflow-hidden rounded-full bg-secondary h-2',
  {
    variants: {
      variant: {
        default: '[&>div]:bg-primary',
        bronze: '[&>div]:bg-[#CD7F32]',
        silver: '[&>div]:bg-[#C0C0C0]',
        gold: '[&>div]:bg-[#FFD700]',
        platinum: '[&>div]:bg-[#E5E4E2]',
        diamond: '[&>div]:bg-[#B9F2FF]'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

interface ProgressProps 
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  value: number;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress }; 
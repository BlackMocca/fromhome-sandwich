import * as React from 'react';
import { cn } from '@/lib/utils';

// Button variants matching DESIGN.md posture rules
export type ButtonVariant = 'default' | 'primary' | 'action' | 'success' | 'destructive' | 'ghost';
export type ButtonSize = 'default' | 'xs' | 'sm' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action border';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-white hover:bg-primary/90',
  primary: 'bg-primary text-white hover:bg-primary/90',
  action: 'bg-action text-primary hover:bg-action/90 shadow-sm',
  success: 'bg-success text-white hover:bg-success/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  ghost: 'bg-white text-black/50 hover:bg-black/5 border-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'px-4 py-2 h-10 text-sm',
  xs: 'px-2 py-1 h-6 text-[10px]',
  sm: 'px-3 py-1.5 h-8 text-xs',
  lg: 'px-6 py-3 h-12 text-base',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };

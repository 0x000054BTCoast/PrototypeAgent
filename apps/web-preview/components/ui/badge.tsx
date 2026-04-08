import * as React from 'react';
import { asSize, asState, cx, type Size, type State } from '@/components/ui/style-system';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning';

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-muted text-text',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700'
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5'
};
const stateClasses: Record<State, string> = {
  default: '',
  active: 'ring-1 ring-blue-400',
  disabled: 'opacity-50',
  loading: 'animate-pulse',
  error: 'ring-1 ring-red-500',
  success: 'ring-1 ring-emerald-500'
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  state = 'default',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant; size?: Size; state?: State }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[asSize(size)],
        stateClasses[asState(state)],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

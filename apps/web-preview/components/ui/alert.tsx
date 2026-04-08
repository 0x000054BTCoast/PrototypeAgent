import * as React from 'react';
import { asSize, asState, cx, type Size, type State } from '@/components/ui/style-system';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';
const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-red-50 border-red-200 text-red-800'
};
const sizeClasses: Record<Size, string> = {
  sm: 'text-xs p-2',
  md: 'text-sm p-3',
  lg: 'text-base p-4'
};
const stateClasses: Record<State, string> = {
  default: '',
  active: 'ring-1 ring-blue-300',
  disabled: 'opacity-60',
  loading: 'animate-pulse',
  error: 'ring-1 ring-red-500',
  success: 'ring-1 ring-emerald-500'
};

export function Alert({
  variant = 'info',
  size = 'md',
  state = 'default',
  className,
  title,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  size?: Size;
  state?: State;
  title?: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        'rounded-md border',
        variantClasses[variant],
        sizeClasses[asSize(size)],
        stateClasses[asState(state)],
        className
      )}
      {...props}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}

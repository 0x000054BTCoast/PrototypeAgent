import * as React from 'react';
import { asSize, asState, cx, type Size, type State } from '@/components/ui/style-system';

type CardVariant = 'elevated' | 'outline' | 'filled';

const variantClasses: Record<CardVariant, string> = {
  elevated: 'bg-surface border border-border shadow-sm',
  outline: 'bg-transparent border border-border',
  filled: 'bg-surface-muted border border-transparent'
};

const sizeClasses: Record<Size, string> = {
  sm: 'p-sm rounded-md',
  md: 'p-md rounded-lg',
  lg: 'p-lg rounded-xl'
};

const stateClasses: Record<State, string> = {
  default: '',
  active: 'ring-2 ring-blue-400',
  disabled: 'opacity-60',
  loading: 'animate-pulse',
  error: 'ring-2 ring-red-500',
  success: 'ring-2 ring-emerald-500'
};

export interface CardSlots {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: Size;
  state?: State;
  slots?: CardSlots;
}

export function Card({
  className,
  variant = 'elevated',
  size = 'md',
  state = 'default',
  slots,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cx(
        'space-y-sm transition',
        variantClasses[variant],
        sizeClasses[asSize(size)],
        stateClasses[asState(state)],
        className
      )}
      {...props}
    >
      {slots?.header}
      <div>{slots?.body ?? children}</div>
      {slots?.footer}
    </div>
  );
}

import * as React from 'react';
import { asSize, asState, asString, cx, type Size, type State } from '@/components/ui/style-system';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-surface-muted text-text border border-border hover:bg-surface',
  ghost: 'bg-transparent text-text hover:bg-surface-muted',
  danger: 'bg-red-600 text-white hover:bg-red-500'
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-sm py-xs text-xs',
  md: 'px-md py-sm text-sm',
  lg: 'px-lg py-md text-base'
};

const stateClasses: Record<State, string> = {
  default: '',
  active: 'ring-2 ring-blue-400 ring-offset-1',
  disabled: 'cursor-not-allowed opacity-50',
  loading: 'cursor-wait opacity-80',
  error: 'ring-2 ring-red-500 ring-offset-1',
  success: 'ring-2 ring-emerald-500 ring-offset-1'
};

export interface ButtonSlots {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  state?: State;
  slots?: ButtonSlots;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  state = 'default',
  slots,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const resolvedVariant = asString(variant, 'primary') as ButtonVariant;
  const resolvedSize = asSize(size);
  const resolvedState = asState(state);
  const content = children ?? 'Action';

  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium shadow-sm transition',
        variantClasses[resolvedVariant],
        sizeClasses[resolvedSize],
        stateClasses[resolvedState],
        className
      )}
      disabled={disabled || resolvedState === 'disabled' || resolvedState === 'loading'}
      {...props}
    >
      {slots?.leading}
      <span>{resolvedState === 'loading' ? 'Loading…' : content}</span>
      {slots?.trailing}
    </button>
  );
}

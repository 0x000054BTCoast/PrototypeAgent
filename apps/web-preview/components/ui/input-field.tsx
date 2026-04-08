import * as React from 'react';
import { asSize, asState, cx, type Size, type State } from '@/components/ui/style-system';

type InputVariant = 'outline' | 'filled';
const variantClasses: Record<InputVariant, string> = {
  outline: 'border border-border bg-surface',
  filled: 'border border-transparent bg-surface-muted'
};
const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base'
};
const stateClasses: Record<State, string> = {
  default: '',
  active: 'ring-2 ring-blue-400',
  disabled: 'opacity-50 cursor-not-allowed',
  loading: 'animate-pulse',
  error: 'ring-2 ring-red-500',
  success: 'ring-2 ring-emerald-500'
};

export function InputField({
  variant = 'outline',
  size = 'md',
  state = 'default',
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  variant?: InputVariant;
  size?: Size;
  state?: State;
}) {
  return (
    <input
      className={cx(
        'w-full rounded-md transition',
        variantClasses[variant],
        sizeClasses[asSize(size)],
        stateClasses[asState(state)],
        className
      )}
      disabled={props.disabled || state === 'disabled'}
      {...props}
    />
  );
}

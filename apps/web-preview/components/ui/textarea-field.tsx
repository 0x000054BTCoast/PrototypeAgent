import * as React from 'react';
import { asSize, asState, cx, type Size, type State } from '@/components/ui/style-system';

type TextareaVariant = 'outline' | 'filled';
const variantClasses: Record<TextareaVariant, string> = {
  outline: 'border border-border bg-surface',
  filled: 'border border-transparent bg-surface-muted'
};
const sizeClasses: Record<Size, string> = {
  sm: 'min-h-20 p-2 text-xs',
  md: 'min-h-24 p-3 text-sm',
  lg: 'min-h-32 p-4 text-base'
};
const stateClasses: Record<State, string> = {
  default: '',
  active: 'ring-2 ring-blue-400',
  disabled: 'opacity-50 cursor-not-allowed',
  loading: 'animate-pulse',
  error: 'ring-2 ring-red-500',
  success: 'ring-2 ring-emerald-500'
};

export function TextareaField({
  variant = 'outline',
  size = 'md',
  state = 'default',
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: TextareaVariant;
  size?: Size;
  state?: State;
}) {
  return (
    <textarea
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

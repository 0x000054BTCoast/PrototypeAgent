import * as React from 'react';
import { asSize, asState, cx, type Size, type State } from '@/components/ui/style-system';

type TabsVariant = 'line' | 'pills';
const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2'
};
const stateClasses: Record<State, string> = {
  default: '',
  active: '',
  disabled: 'opacity-60',
  loading: 'animate-pulse',
  error: 'ring-1 ring-red-500',
  success: 'ring-1 ring-emerald-500'
};

export function Tabs({
  labels,
  variant = 'line',
  size = 'md',
  state = 'default'
}: {
  labels: string[];
  variant?: TabsVariant;
  size?: Size;
  state?: State;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label, index) => (
        <button
          key={label}
          className={cx(
            'rounded-md transition',
            sizeClasses[asSize(size)],
            stateClasses[asState(state)],
            variant === 'pills'
              ? index === 0
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-muted text-text'
              : index === 0
                ? 'border-b-2 border-primary text-text'
                : 'border-b-2 border-transparent text-text-muted'
          )}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

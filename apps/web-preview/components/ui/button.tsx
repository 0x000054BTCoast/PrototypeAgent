import * as React from 'react';

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  state = 'default',
  slots,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'active' | 'disabled' | 'loading' | 'error' | 'success';
  slots?: { leading?: React.ReactNode; trailing?: React.ReactNode };
}) {
  const variantClasses = {
    primary: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
    secondary:
      'border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
    ghost: 'bg-transparent text-slate-900 dark:text-slate-100',
    danger: 'bg-red-600 text-white'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base'
  };
  const stateClasses = {
    default: '',
    active: 'ring-2 ring-blue-500',
    disabled: 'opacity-50 cursor-not-allowed',
    loading: 'opacity-80 cursor-wait',
    error: 'ring-2 ring-red-500',
    success: 'ring-2 ring-emerald-500'
  };

  return (
    <button
      className={`inline-flex items-center gap-2 rounded-xl font-medium shadow-sm transition ${variantClasses[variant]} ${sizeClasses[size]} ${stateClasses[state]} ${className}`}
      disabled={state === 'disabled' || state === 'loading'}
      {...props}
    >
      {slots?.leading}
      <span>{state === 'loading' ? 'Loading…' : children}</span>
      {slots?.trailing}
    </button>
  );
}

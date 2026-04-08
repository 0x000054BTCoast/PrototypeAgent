import * as React from 'react';

export function Card({
  className = '',
  variant = 'elevated',
  size = 'md',
  state = 'default',
  slots,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'elevated' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'active' | 'disabled' | 'loading' | 'error' | 'success';
  slots?: { header?: React.ReactNode; footer?: React.ReactNode };
}) {
  const variantClasses = {
    elevated: 'border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
    outline: 'border border-slate-200 bg-transparent dark:border-slate-800',
    filled: 'border border-transparent bg-slate-100 dark:bg-slate-800'
  };
  const sizeClasses = { sm: 'p-3 rounded-lg', md: 'p-4 rounded-xl', lg: 'p-6 rounded-2xl' };
  const stateClasses = {
    default: '',
    active: 'ring-2 ring-blue-500',
    disabled: 'opacity-50',
    loading: 'animate-pulse',
    error: 'ring-2 ring-red-500',
    success: 'ring-2 ring-emerald-500'
  };

  return (
    <div
      className={`space-y-2 ${variantClasses[variant]} ${sizeClasses[size]} ${stateClasses[state]} ${className}`}
      {...props}
    >
      {slots?.header}
      <div>{children}</div>
      {slots?.footer}
    </div>
  );
}

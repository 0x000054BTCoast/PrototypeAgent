import * as React from 'react';

type BadgeVariant = 'default' | 'info' | 'success' | 'warning';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  info: 'bg-sky-100 text-sky-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700'
};

export function Badge({
  children,
  className = '',
  variant = 'default'
}: {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

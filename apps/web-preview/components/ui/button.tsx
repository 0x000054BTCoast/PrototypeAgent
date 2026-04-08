import * as React from 'react';

export function Button({
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center rounded-md bg-primary px-md py-sm text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 ${className}`}
      {...props}
    />
  );
}

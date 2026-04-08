'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/workspace/analytics', label: 'Analytics' },
  { href: '/workspace/reports', label: 'Reports' },
  { href: '/workspace/admin', label: 'Admin' },
  { href: '/workbench', label: 'Workbench' }
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace navigation" className="space-y-xs">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'block rounded-md border px-md py-sm text-sm transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-text hover:bg-surface-muted'
            ].join(' ')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

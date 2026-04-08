import type { ReactNode } from 'react';

import { SideNav } from '@/components/navigation/side-nav';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-bg px-md py-lg text-text md:px-xl lg:px-2xl">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-lg lg:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-border bg-surface p-md shadow-sm">
          <div className="mb-md flex items-center justify-between gap-sm">
            <h1 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Workspace
            </h1>
            <ThemeToggle />
          </div>
          <SideNav />
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
}

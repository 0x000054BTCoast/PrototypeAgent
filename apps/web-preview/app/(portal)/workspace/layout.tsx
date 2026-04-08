import type { ReactNode } from 'react';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-md">
      <header className="rounded-xl border border-border bg-surface p-lg shadow-sm">
        <h2 className="text-title font-semibold">Prototype Workspace</h2>
        <p className="mt-xs text-sm text-text-muted">
          Nested routes + shared layout demo for generated prototypes.
        </p>
      </header>
      {children}
    </div>
  );
}

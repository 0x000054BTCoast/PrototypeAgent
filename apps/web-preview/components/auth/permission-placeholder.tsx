import type { ReactNode } from 'react';

interface PermissionPlaceholderProps {
  allowed: boolean;
  feature: string;
  requiredRole: string;
  children: ReactNode;
}

export function PermissionPlaceholder({
  allowed,
  feature,
  requiredRole,
  children
}: PermissionPlaceholderProps) {
  if (allowed) {
    return <>{children}</>;
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-lg shadow-sm">
      <h2 className="text-lg font-semibold">权限占位 / Access Required</h2>
      <p className="mt-sm text-sm text-text-muted">
        当前账号缺少访问 <strong>{feature}</strong> 的权限，请联系管理员分配
        <code className="mx-xs rounded bg-surface-muted px-xs py-[2px] text-xs">
          {requiredRole}
        </code>
        角色。
      </p>
    </section>
  );
}

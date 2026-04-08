import { PermissionPlaceholder } from '@/components/auth/permission-placeholder';
import { Card } from '@/components/ui/card';
import { hasRole } from '@/lib/auth/permissions';

export default function AdminPage() {
  const canAccessAdmin = hasRole('admin');

  return (
    <PermissionPlaceholder allowed={canAccessAdmin} feature="Admin Workspace" requiredRole="admin">
      <Card>
        <p className="text-base font-medium">Admin controls</p>
        <p className="mt-sm text-sm text-text-muted">Only visible when user has admin role.</p>
      </Card>
    </PermissionPlaceholder>
  );
}

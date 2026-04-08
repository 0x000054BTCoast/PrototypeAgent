const currentUserRoles = new Set(['analyst']);

export const hasRole = (role: string) => currentUserRoles.has(role);

export function getRoleList(role: unknown): string[] {
  if (!role) return [];

  if (Array.isArray(role)) {
    return role
      .map((entry) => String(entry).trim().toUpperCase())
      .filter(Boolean);
  }

  return String(role)
    .split(",")
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);
}

export function hasRole(role: unknown, roleName: string): boolean {
  return getRoleList(role).includes(roleName.toUpperCase());
}

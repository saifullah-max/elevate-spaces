/**
 * Normalize backend team-role identifiers (with or without the TEAM_ prefix)
 * into a friendly label for display.
 */
export function normalizeTeamRole(role: unknown, fallback = "Member"): string {
  const raw =
    typeof role === "string"
      ? role
      : (role as { name?: string } | null | undefined)?.name;
  if (!raw) return fallback;
  const trimmed = raw.replace(/^TEAM_/i, "").toUpperCase();
  switch (trimmed) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "MEMBER":
      return "Member";
    case "PHOTOGRAPHER":
      return "Photographer";
    default:
      return trimmed
        .toLowerCase()
        .replace(/(^|_)([a-z])/g, (_, __, c: string) => " " + c.toUpperCase())
        .trim();
  }
}

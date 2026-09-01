export type EffectiveWorkspaceRole =
  | "OWNER"
  | "ADMIN"
  | "READ_ONLY"
  | "LEGACY_TECHNICIAN";

export function getWorkspacePermissions(
  role: EffectiveWorkspaceRole,
  hasBillingAccess: boolean,
) {
  const roleAllowsWrite =
    role === "OWNER" || role === "ADMIN" || role === "LEGACY_TECHNICIAN";
  const hasFullAccess = roleAllowsWrite && hasBillingAccess;

  return {
    canRead: true,
    canWrite: hasFullAccess,
    canUseForge: hasFullAccess,
    canManageTeam: role === "OWNER" && hasBillingAccess,
  };
}

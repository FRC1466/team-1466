export const PERMISSION_LEVELS = [
  "manager",
  "mentor",
  "team_lead",
  "subteam_lead",
  "sme",
  "member",
] as const;

export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

export const PERMISSION_LABEL: Record<PermissionLevel, string> = {
  manager: "Manager",
  mentor: "Mentor",
  team_lead: "Team Lead",
  subteam_lead: "Subteam Lead",
  sme: "Subject Matter Expert",
  member: "Member",
};

export const PERMISSION_COLOR: Record<PermissionLevel, string> = {
  manager: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  mentor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  team_lead: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  subteam_lead: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  sme: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  member: "bg-muted text-muted-foreground border-border",
};

export const MEMBER_STATUSES = ["active", "inactive", "pending", "alumni"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  alumni: "Alumni",
};

export const LOGIN_ACCESS = ["enabled", "disabled", "pending"] as const;
export type LoginAccess = (typeof LOGIN_ACCESS)[number];

export const LOGIN_ACCESS_LABEL: Record<LoginAccess, string> = {
  enabled: "Enabled",
  disabled: "Disabled",
  pending: "Pending",
};

export function canEdit(level: PermissionLevel | null | undefined): boolean {
  if (!level) return false;
  return level === "manager" || level === "mentor";
}

export function isManager(level: PermissionLevel | null | undefined): boolean {
  return level === "manager";
}

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export type Member = Doc<"members">;
export type PermissionLevel = Member["permission"];

const RANK: Record<PermissionLevel, number> = {
  manager: 100,
  mentor: 80,
  team_lead: 60,
  subteam_lead: 40,
  sme: 20,
  member: 0,
};

export const PERMISSION_LABEL: Record<PermissionLevel, string> = {
  manager: "Manager",
  mentor: "Mentor",
  team_lead: "Team Lead",
  subteam_lead: "Subteam Lead",
  sme: "Subject Matter Expert",
  member: "Member",
};

export function rank(level: PermissionLevel): number {
  return RANK[level];
}

export function canEdit(level: PermissionLevel | undefined): boolean {
  if (!level) return false;
  return rank(level) >= rank("mentor");
}

export function isManager(level: PermissionLevel | undefined): boolean {
  return level === "manager";
}

export async function currentUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users"> | null> {
  return await getAuthUserId(ctx);
}

export async function currentMember(
  ctx: QueryCtx | MutationCtx,
): Promise<Member | null> {
  const userId = await currentUserId(ctx);
  if (!userId) return null;
  return await ctx.db
    .query("members")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

export async function requireMember(ctx: QueryCtx | MutationCtx): Promise<Member> {
  const member = await currentMember(ctx);
  if (!member) throw new Error("Not authenticated as a workspace member.");
  return member;
}

export async function requireEditor(ctx: MutationCtx): Promise<Member> {
  const member = await requireMember(ctx);
  if (!canEdit(member.permission)) {
    throw new Error("You don't have permission to edit. Manager or mentor only.");
  }
  return member;
}

export async function requireManager(ctx: MutationCtx): Promise<Member> {
  const member = await requireMember(ctx);
  if (!isManager(member.permission)) {
    throw new Error("Manager only.");
  }
  return member;
}

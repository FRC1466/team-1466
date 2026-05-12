import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const permissionLevel = v.union(
  v.literal("manager"),
  v.literal("mentor"),
  v.literal("team_lead"),
  v.literal("subteam_lead"),
  v.literal("sme"),
  v.literal("member"),
);

export const memberStatus = v.union(
  v.literal("active"),
  v.literal("inactive"),
  v.literal("pending"),
  v.literal("alumni"),
);

export const loginAccess = v.union(
  v.literal("enabled"),
  v.literal("disabled"),
  v.literal("pending"),
);

export default defineSchema({
  ...authTables,

  workspace: defineTable({
    name: v.string(),
    createdAt: v.number(),
    claimedBy: v.optional(v.id("users")),
  }),

  subteams: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  skills: defineTable({
    name: v.string(),
    category: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  members: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    permission: permissionLevel,
    isMentor: v.boolean(),
    isTeamLead: v.boolean(),
    isSubteamLead: v.boolean(),
    isSME: v.boolean(),
    primaryRole: v.optional(v.string()),
    subteamIds: v.array(v.id("subteams")),
    leadOfSubteamIds: v.array(v.id("subteams")),
    skillIds: v.array(v.id("skills")),
    expertiseTags: v.array(v.string()),
    status: memberStatus,
    loginAccess: loginAccess,
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    lastUpdatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"])
    .index("by_permission", ["permission"])
    .index("by_status", ["status"]),

  notes: defineTable({
    memberId: v.optional(v.id("members")),
    subteamId: v.optional(v.id("subteams")),
    authorId: v.id("members"),
    kind: v.union(
      v.literal("member"),
      v.literal("skill"),
      v.literal("role_change"),
      v.literal("reminder"),
      v.literal("setup"),
      v.literal("access"),
      v.literal("general"),
    ),
    title: v.optional(v.string()),
    body: v.string(),
    pinned: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_member", ["memberId"])
    .index("by_subteam", ["subteamId"])
    .index("by_kind", ["kind"]),

  activity: defineTable({
    actorId: v.optional(v.id("members")),
    targetMemberId: v.optional(v.id("members")),
    kind: v.union(
      v.literal("member_created"),
      v.literal("member_updated"),
      v.literal("permission_changed"),
      v.literal("subteam_joined"),
      v.literal("subteam_left"),
      v.literal("access_changed"),
      v.literal("note_added"),
      v.literal("workspace_claimed"),
      v.literal("subteam_created"),
      v.literal("skill_created"),
      v.literal("signed_in"),
    ),
    summary: v.string(),
    meta: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_member", ["targetMemberId"])
    .index("by_created", ["createdAt"]),
});

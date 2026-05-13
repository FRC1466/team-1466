import { v } from "convex/values";
import { internalQuery, mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  currentMember,
  currentUserId,
  requireEditor,
  requireMember,
} from "./permissions";
import { permissionLevel, memberStatus, loginAccess } from "./schema";

type Member = Doc<"members">;

function deriveFlags(level: Member["permission"]) {
  return {
    isMentor: level === "mentor" || level === "manager",
    isTeamLead: level === "team_lead" || level === "manager",
  };
}

async function logActivity(
  ctx: MutationCtx,
  data: {
    actorId?: Id<"members">;
    targetMemberId?: Id<"members">;
    kind: Doc<"activity">["kind"];
    summary: string;
    meta?: unknown;
  },
) {
  await ctx.db.insert("activity", {
    actorId: data.actorId,
    targetMemberId: data.targetMemberId,
    kind: data.kind,
    summary: data.summary,
    meta: data.meta,
    createdAt: Date.now(),
  });
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    if (!userId) return null;
    const member = await currentMember(ctx);
    return { userId, member };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentMember(ctx);
    if (!me) return [];
    const members = await ctx.db.query("members").collect();
    return members.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    await requireMember(ctx);
    return await ctx.db.get(args.id);
  },
});

export const claimManager = mutation({
  args: {
    name: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    if (!userId) throw new Error("Sign in first.");

    const existingMembers = await ctx.db.query("members").collect();

    const meAlready = existingMembers.find((m) => m.userId === userId);
    if (meAlready) {
      throw new Error("You already have a member profile.");
    }

    const isFirst = existingMembers.length === 0;
    if (!isFirst) {
      throw new Error("Manager has already been claimed.");
    }

    const now = Date.now();
    const memberId = await ctx.db.insert("members", {
      userId,
      name: args.name,
      username: args.username,
      email: undefined,
      phone: undefined,
      permission: "manager",
      isMentor: true,
      isTeamLead: true,
      isSubteamLead: false,
      isSME: false,
      primaryRole: "Manager",
      subteamIds: [],
      leadOfSubteamIds: [],
      skillIds: [],
      expertiseTags: [],
      status: "active",
      loginAccess: "enabled",
      bio: undefined,
      avatarStorageId: undefined,
      lastUpdatedAt: now,
      createdAt: now,
    });

    const workspace = await ctx.db.query("workspace").first();
    if (workspace) {
      await ctx.db.patch(workspace._id, { claimedBy: userId });
    }

    await logActivity(ctx, {
      actorId: memberId,
      targetMemberId: memberId,
      kind: "workspace_claimed",
      summary: `${args.name} claimed the manager role`,
    });

    return memberId;
  },
});

export const createSelfMember = mutation({
  args: {
    name: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    if (!userId) throw new Error("Sign in first.");

    const existing = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      throw new Error("You already have a member profile.");
    }

    const now = Date.now();
    const memberId = await ctx.db.insert("members", {
      userId,
      name: args.name,
      username: args.username,
      email: undefined,
      phone: undefined,
      permission: "member",
      isMentor: false,
      isTeamLead: false,
      isSubteamLead: false,
      isSME: false,
      primaryRole: undefined,
      subteamIds: [],
      leadOfSubteamIds: [],
      skillIds: [],
      expertiseTags: [],
      status: "pending",
      loginAccess: "enabled",
      bio: undefined,
      avatarStorageId: undefined,
      lastUpdatedAt: now,
      createdAt: now,
    });

    await logActivity(ctx, {
      actorId: memberId,
      targetMemberId: memberId,
      kind: "member_created",
      summary: `${args.name} joined the team`,
    });
    return memberId;
  },
});

export const update = mutation({
  args: {
    id: v.id("members"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    permission: v.optional(permissionLevel),
    primaryRole: v.optional(v.string()),
    isMentor: v.optional(v.boolean()),
    isTeamLead: v.optional(v.boolean()),
    isSubteamLead: v.optional(v.boolean()),
    isSME: v.optional(v.boolean()),
    subteamIds: v.optional(v.array(v.id("subteams"))),
    leadOfSubteamIds: v.optional(v.array(v.id("subteams"))),
    skillIds: v.optional(v.array(v.id("skills"))),
    expertiseTags: v.optional(v.array(v.string())),
    status: v.optional(memberStatus),
    loginAccess: v.optional(loginAccess),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const editor = await requireEditor(ctx);
    const { id, ...rest } = args;
    const target = await ctx.db.get(id);
    if (!target) throw new Error("Member not found.");

    if (
      rest.permission &&
      rest.permission !== target.permission &&
      editor.permission !== "manager"
    ) {
      throw new Error("Only the manager can change permission levels.");
    }

    const patch: Partial<Member> = {
      ...rest,
      lastUpdatedAt: Date.now(),
    };

    if (rest.permission) {
      const flags = deriveFlags(rest.permission);
      if (rest.isMentor === undefined) patch.isMentor = flags.isMentor;
      if (rest.isTeamLead === undefined) patch.isTeamLead = flags.isTeamLead;
    }

    await ctx.db.patch(id, patch);

    if (rest.permission && rest.permission !== target.permission) {
      await logActivity(ctx, {
        actorId: editor._id,
        targetMemberId: id,
        kind: "permission_changed",
        summary: `${target.name}: ${target.permission} → ${rest.permission}`,
      });
    } else {
      await logActivity(ctx, {
        actorId: editor._id,
        targetMemberId: id,
        kind: "member_updated",
        summary: `${target.name}'s profile was updated`,
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const editor = await requireEditor(ctx);
    const target = await ctx.db.get(args.id);
    if (!target) return;
    if (target.permission === "manager") {
      throw new Error("You cannot remove the manager.");
    }
    if (target._id === editor._id) {
      throw new Error("You cannot remove yourself.");
    }
    await ctx.db.delete(args.id);
    await logActivity(ctx, {
      actorId: editor._id,
      kind: "member_updated",
      summary: `${target.name} was removed from the team`,
    });
  },
});

export const adminCreate = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    permission: permissionLevel,
    primaryRole: v.optional(v.string()),
    subteamIds: v.optional(v.array(v.id("subteams"))),
    skillIds: v.optional(v.array(v.id("skills"))),
    expertiseTags: v.optional(v.array(v.string())),
    status: v.optional(memberStatus),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const editor = await requireEditor(ctx);
    const flags = deriveFlags(args.permission);
    const now = Date.now();

    const id = await ctx.db.insert("members", {
      userId: undefined,
      name: args.name,
      username: args.username,
      email: args.email,
      phone: args.phone,
      permission: args.permission,
      isMentor: flags.isMentor,
      isTeamLead: flags.isTeamLead,
      isSubteamLead: false,
      isSME: args.permission === "sme",
      primaryRole: args.primaryRole,
      subteamIds: args.subteamIds ?? [],
      leadOfSubteamIds: [],
      skillIds: args.skillIds ?? [],
      expertiseTags: args.expertiseTags ?? [],
      status: args.status ?? "pending",
      loginAccess: "pending",
      bio: args.bio,
      avatarStorageId: undefined,
      lastUpdatedAt: now,
      createdAt: now,
    });

    await logActivity(ctx, {
      actorId: editor._id,
      targetMemberId: id,
      kind: "member_created",
      summary: `${editor.name} added ${args.name}`,
    });

    return id;
  },
});

// ---------------------------------------------------------------------------
// WebbPower integration — internal query
// ---------------------------------------------------------------------------

/**
 * Internal query used by the HTTP member-lookup endpoint.
 * Returns a member's permission level and status for a given email address,
 * or null if no matching auth user / member is found.
 */
export const lookupByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const authUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    if (!authUser) return null;

    const member = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", authUser._id))
      .first();
    if (!member) return null;

    return {
      permission: member.permission,
      name: member.name,
      status: member.status,
    };
  },
});

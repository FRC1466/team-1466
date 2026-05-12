import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { currentMember, currentUserId, requireManager } from "./permissions";

const DEFAULT_SUBTEAMS = [
  { name: "Media", slug: "media", color: "#ec4899" },
  { name: "Programming", slug: "programming", color: "#3b82f6" },
  { name: "Electrical", slug: "electrical", color: "#f59e0b" },
  { name: "Build", slug: "build", color: "#10b981" },
  { name: "CAD", slug: "cad", color: "#8b5cf6" },
  { name: "Business", slug: "business", color: "#14b8a6" },
];

const DEFAULT_SKILLS = [
  { name: "Primary Programmer", category: "Programming" },
  { name: "Primary CAD", category: "CAD" },
  { name: "Wiring Expert", category: "Electrical" },
  { name: "Media Lead", category: "Media" },
  { name: "Build Specialist", category: "Build" },
];

export const get = query({
  args: {},
  handler: async (ctx) => {
    const ws = await ctx.db.query("workspace").first();
    return ws;
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("workspace").first();
    if (existing) {
      throw new Error("Workspace already exists.");
    }
    const userId = await currentUserId(ctx);
    if (!userId) throw new Error("Sign in first.");

    const now = Date.now();
    await ctx.db.insert("workspace", {
      name: args.name,
      createdAt: now,
      claimedBy: undefined,
    });

    for (const st of DEFAULT_SUBTEAMS) {
      await ctx.db.insert("subteams", {
        name: st.name,
        slug: st.slug,
        color: st.color,
        description: undefined,
        createdAt: now,
      });
    }
    for (const sk of DEFAULT_SKILLS) {
      await ctx.db.insert("skills", {
        name: sk.name,
        category: sk.category,
        createdAt: now,
      });
    }
  },
});

export const rename = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireManager(ctx);
    const ws = await ctx.db.query("workspace").first();
    if (!ws) throw new Error("Workspace not found.");
    await ctx.db.patch(ws._id, { name: args.name });
  },
});

export const setupState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    const workspace = await ctx.db.query("workspace").first();
    const memberCount = (await ctx.db.query("members").collect()).length;
    const me = await currentMember(ctx);
    return {
      isAuthenticated: userId !== null,
      hasWorkspace: workspace !== null,
      hasMembers: memberCount > 0,
      memberCount,
      workspaceName: workspace?.name ?? null,
      meExists: me !== null,
      mePermission: me?.permission ?? null,
    };
  },
});

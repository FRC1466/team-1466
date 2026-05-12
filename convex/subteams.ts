import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireEditor, requireMember } from "./permissions";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireMember(ctx);
    const subteams = await ctx.db.query("subteams").collect();
    return subteams.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const editor = await requireEditor(ctx);
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existing = await ctx.db
      .query("subteams")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) throw new Error("Subteam already exists.");
    const id = await ctx.db.insert("subteams", {
      name: args.name,
      slug,
      description: args.description,
      color: args.color,
      createdAt: Date.now(),
    });
    await ctx.db.insert("activity", {
      actorId: editor._id,
      kind: "subteam_created",
      summary: `${editor.name} created subteam ${args.name}`,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("subteams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("subteams") },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const members = await ctx.db.query("members").collect();
    for (const m of members) {
      const newSubteams = m.subteamIds.filter((s) => s !== args.id);
      const newLeads = m.leadOfSubteamIds.filter((s) => s !== args.id);
      if (
        newSubteams.length !== m.subteamIds.length ||
        newLeads.length !== m.leadOfSubteamIds.length
      ) {
        await ctx.db.patch(m._id, {
          subteamIds: newSubteams,
          leadOfSubteamIds: newLeads,
        });
      }
    }
    await ctx.db.delete(args.id);
  },
});

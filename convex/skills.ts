import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireEditor, requireMember } from "./permissions";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireMember(ctx);
    const skills = await ctx.db.query("skills").collect();
    return skills.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const editor = await requireEditor(ctx);
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    if (existing) throw new Error("Skill already exists.");
    const id = await ctx.db.insert("skills", {
      name: args.name,
      category: args.category,
      createdAt: Date.now(),
    });
    await ctx.db.insert("activity", {
      actorId: editor._id,
      kind: "skill_created",
      summary: `${editor.name} added skill ${args.name}`,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("skills") },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const members = await ctx.db.query("members").collect();
    for (const m of members) {
      const newSkills = m.skillIds.filter((s) => s !== args.id);
      if (newSkills.length !== m.skillIds.length) {
        await ctx.db.patch(m._id, { skillIds: newSkills });
      }
    }
    await ctx.db.delete(args.id);
  },
});

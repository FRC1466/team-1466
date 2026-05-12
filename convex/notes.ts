import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireEditor, requireMember } from "./permissions";

export const list = query({
  args: {
    memberId: v.optional(v.id("members")),
    subteamId: v.optional(v.id("subteams")),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx);
    let docs;
    if (args.memberId) {
      docs = await ctx.db
        .query("notes")
        .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
        .collect();
    } else if (args.subteamId) {
      docs = await ctx.db
        .query("notes")
        .withIndex("by_subteam", (q) => q.eq("subteamId", args.subteamId))
        .collect();
    } else {
      docs = await ctx.db.query("notes").collect();
    }
    return docs.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    memberId: v.optional(v.id("members")),
    subteamId: v.optional(v.id("subteams")),
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
    pinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const author = await requireEditor(ctx);
    const id = await ctx.db.insert("notes", {
      memberId: args.memberId,
      subteamId: args.subteamId,
      authorId: author._id,
      kind: args.kind,
      title: args.title,
      body: args.body,
      pinned: args.pinned ?? false,
      createdAt: Date.now(),
    });
    await ctx.db.insert("activity", {
      actorId: author._id,
      targetMemberId: args.memberId,
      kind: "note_added",
      summary: `${author.name} added a note`,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const togglePinned = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const note = await ctx.db.get(args.id);
    if (!note) return;
    await ctx.db.patch(args.id, { pinned: !note.pinned });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    await ctx.db.delete(args.id);
  },
});

import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireMember } from "./permissions";

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireMember(ctx);
    const limit = args.limit ?? 20;
    const items = await ctx.db
      .query("activity")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
    return items;
  },
});

export const forMember = query({
  args: { memberId: v.id("members"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireMember(ctx);
    const items = await ctx.db
      .query("activity")
      .withIndex("by_member", (q) => q.eq("targetMemberId", args.memberId))
      .order("desc")
      .take(args.limit ?? 20);
    return items;
  },
});

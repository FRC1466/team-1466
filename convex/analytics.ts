import { query } from "./_generated/server";
import { requireMember } from "./permissions";

export const summary = query({
  args: {},
  handler: async (ctx) => {
    await requireMember(ctx);
    const [members, subteams, skills] = await Promise.all([
      ctx.db.query("members").collect(),
      ctx.db.query("subteams").collect(),
      ctx.db.query("skills").collect(),
    ]);

    const active = members.filter((m) => m.status === "active");
    const pending = members.filter((m) => m.status === "pending");

    const subteamCounts = subteams.map((st) => ({
      _id: st._id,
      name: st.name,
      slug: st.slug,
      color: st.color,
      count: members.filter((m) => m.subteamIds.includes(st._id)).length,
      leads: members.filter((m) => m.leadOfSubteamIds.includes(st._id)).map(
        (m) => ({ _id: m._id, name: m.name }),
      ),
      smes: members
        .filter((m) => m.isSME && m.subteamIds.includes(st._id))
        .map((m) => ({ _id: m._id, name: m.name })),
    }));

    const byPermission = {
      manager: members.filter((m) => m.permission === "manager").length,
      mentor: members.filter((m) => m.permission === "mentor").length,
      team_lead: members.filter((m) => m.permission === "team_lead").length,
      subteam_lead: members.filter((m) => m.permission === "subteam_lead").length,
      sme: members.filter((m) => m.permission === "sme").length,
      member: members.filter((m) => m.permission === "member").length,
    };

    const noSubteam = members.filter((m) => m.subteamIds.length === 0);
    const noRole = members.filter((m) => !m.primaryRole);
    const needsSetup = members.filter(
      (m) =>
        m.status === "pending" ||
        m.loginAccess === "pending" ||
        m.subteamIds.length === 0,
    );

    const openSubteamLeadSlots = subteams.filter(
      (st) =>
        !members.some((m) => m.leadOfSubteamIds.includes(st._id)),
    ).length;
    const mentorCount = members.filter((m) => m.isMentor).length;

    return {
      totals: {
        members: members.length,
        active: active.length,
        pending: pending.length,
        subteams: subteams.length,
        skills: skills.length,
      },
      byPermission,
      subteamCounts,
      noSubteam: noSubteam.map((m) => ({ _id: m._id, name: m.name })),
      noRole: noRole.map((m) => ({ _id: m._id, name: m.name })),
      needsSetup: needsSetup.map((m) => ({
        _id: m._id,
        name: m.name,
        status: m.status,
        loginAccess: m.loginAccess,
      })),
      openSubteamLeadSlots,
      mentorCount,
      smeCount: members.filter((m) => m.isSME).length,
      leadCount: members.filter((m) => m.isTeamLead || m.isSubteamLead).length,
    };
  },
});

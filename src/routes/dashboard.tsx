import { Link } from "react-router";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  ClipboardList,
  KeyRound,
  Plus,
  ShieldCheck,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import { useUI } from "@/lib/ui-store";
import { PermissionBadge } from "@/components/permission-badge";
import { canEdit, PERMISSION_LABEL, type PermissionLevel } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const summary = useQuery(api.analytics.summary);
  const me = useQuery(api.members.me);
  const activity = useQuery(api.activity.recent, { limit: 8 });
  const openDialog = useUI((s) => s.openDialog);
  const meCanEdit = canEdit(me?.member?.permission as PermissionLevel | undefined);

  if (!summary) {
    return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {me?.member ? (
              <>
                Welcome back, <span className="font-medium text-foreground">{me.member.name}</span>{" "}
                — {PERMISSION_LABEL[me.member.permission]}
              </>
            ) : (
              "Welcome to your team workspace."
            )}
          </p>
        </div>
        {meCanEdit && (
          <Button onClick={() => openDialog("create-member")}>
            <Plus className="size-4 mr-2" /> Add member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Active members"
          value={summary.totals.active}
          hint={`${summary.totals.members} total`}
          icon={Users}
        />
        <Stat
          label="Subteams"
          value={summary.totals.subteams}
          hint={`${summary.openSubteamLeadSlots} need a lead`}
          icon={UsersRound}
        />
        <Stat
          label="Mentors"
          value={summary.mentorCount}
          hint="18+ helping run the team"
          icon={ShieldCheck}
        />
        <Stat
          label="Subject matter experts"
          value={summary.smeCount}
          hint="recognized expertise"
          icon={UserCog}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Subteams</CardTitle>
              <CardDescription>Membership and leadership at a glance.</CardDescription>
            </div>
            <Link to="/subteams" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all <ArrowRight className="size-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.subteamCounts.length === 0 && (
              <p className="text-sm text-muted-foreground">No subteams yet.</p>
            )}
            {summary.subteamCounts.map((st) => (
              <div
                key={st._id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: st.color ?? "var(--primary)" }}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{st.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {st.leads.length > 0
                        ? `Lead: ${st.leads.map((l) => l.name).join(", ")}`
                        : "No lead assigned"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{st.count}</div>
                  <div className="text-xs text-muted-foreground">members</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Needs attention</CardTitle>
              <CardDescription>People who need setup or review.</CardDescription>
            </div>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.needsSetup.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Everyone is set up. Nice work.
              </p>
            )}
            {summary.needsSetup.slice(0, 6).map((m) => (
              <Link
                key={m._id}
                to={`/people/${m._id}`}
                className="flex items-center justify-between rounded-md border p-2 hover:bg-accent"
              >
                <div className="text-sm font-medium truncate">{m.name}</div>
                <span className="text-xs text-muted-foreground">
                  {m.status === "pending" ? "Pending" : "Review"}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>Latest changes across the workspace.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(activity ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {(activity ?? []).map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between gap-2 py-1.5 border-b last:border-b-0"
              >
                <span className="text-sm truncate">{a.summary}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {relativeTime(a.createdAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role coverage</CardTitle>
            <CardDescription>Permission distribution across the team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(
              Object.entries(summary.byPermission) as [PermissionLevel, number][]
            ).map(([lvl, count]) => (
              <div key={lvl} className="flex items-center justify-between">
                <PermissionBadge level={lvl} />
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Quick jumps</CardTitle>
              <CardDescription>Common workflows.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Link to="/people" className={cn(buttonVariants({ variant: "outline" }), "justify-start")}>
              <Users className="size-4 mr-2" /> Browse people
            </Link>
            <Link to="/subteams" className={cn(buttonVariants({ variant: "outline" }), "justify-start")}>
              <UsersRound className="size-4 mr-2" /> Manage subteams
            </Link>
            <Link to="/access" className={cn(buttonVariants({ variant: "outline" }), "justify-start")}>
              <KeyRound className="size-4 mr-2" /> Access controls
            </Link>
            <Link to="/notes" className={cn(buttonVariants({ variant: "outline" }), "justify-start")}>
              <ClipboardList className="size-4 mr-2" /> Internal notes
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

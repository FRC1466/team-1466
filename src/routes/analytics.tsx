import { useQuery } from "convex/react";
import { Link } from "react-router";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "../../convex/_generated/api";
import { PERMISSION_LABEL, type PermissionLevel } from "@/lib/constants";

function ProgressFallback({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function AnalyticsPage() {
  const summary = useQuery(api.analytics.summary);
  if (!summary) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const max = Math.max(1, ...summary.subteamCounts.map((s) => s.count));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BarChart3 className="size-6" /> Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Operational insights, not performance tracking.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total people</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.totals.members}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totals.active} active · {summary.totals.pending} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Mentors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.mentorCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.leadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>SMEs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.smeCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">People by subteam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.subteamCounts.map((st) => (
              <div key={st._id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: st.color ?? "var(--primary)" }}
                    />
                    {st.name}
                  </span>
                  <span className="text-muted-foreground">{st.count}</span>
                </div>
                <ProgressFallback value={st.count} max={max} />
              </div>
            ))}
            {summary.subteamCounts.length === 0 && (
              <p className="text-sm text-muted-foreground">No subteams yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">People by permission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.entries(summary.byPermission) as [PermissionLevel, number][]).map(
              ([lvl, count]) => (
                <div key={lvl} className="flex items-center justify-between text-sm">
                  <span>{PERMISSION_LABEL[lvl]}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Members without a subteam</CardTitle>
            <CardDescription>Get them assigned to keep coverage clean.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {summary.noSubteam.length === 0 && (
              <p className="text-sm text-muted-foreground">Everyone is on a subteam.</p>
            )}
            {summary.noSubteam.map((m) => (
              <Link
                key={m._id}
                to={`/people/${m._id}`}
                className="block text-sm py-1 hover:underline"
              >
                {m.name}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Members without a role</CardTitle>
            <CardDescription>Set a primary role to help others find them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {summary.noRole.length === 0 && (
              <p className="text-sm text-muted-foreground">Everyone has a role assigned.</p>
            )}
            {summary.noRole.map((m) => (
              <Link
                key={m._id}
                to={`/people/${m._id}`}
                className="block text-sm py-1 hover:underline"
              >
                {m.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

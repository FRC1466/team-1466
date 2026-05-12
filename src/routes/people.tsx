import { useMemo } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { Plus, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionBadge } from "@/components/permission-badge";
import { StatusBadge } from "@/components/status-badge";
import { CreateMemberDialog } from "@/components/dialogs/create-member-dialog";
import { api } from "../../convex/_generated/api";
import { useUI } from "@/lib/ui-store";
import { PERMISSION_LEVELS, PERMISSION_LABEL, canEdit, type PermissionLevel } from "@/lib/constants";
import { initialsOf, relativeTime } from "@/lib/format";

export function PeoplePage() {
  const members = useQuery(api.members.list) ?? [];
  const subteams = useQuery(api.subteams.list) ?? [];
  const me = useQuery(api.members.me);
  const meCanEdit = canEdit(me?.member?.permission as PermissionLevel | undefined);

  const search = useUI((s) => s.peopleSearch);
  const setSearch = useUI((s) => s.setPeopleSearch);
  const filterSubteam = useUI((s) => s.peopleFilterSubteam);
  const setFilterSubteam = useUI((s) => s.setPeopleFilterSubteam);
  const filterPermission = useUI((s) => s.peopleFilterPermission);
  const setFilterPermission = useUI((s) => s.setPeopleFilterPermission);
  const openDialog = useUI((s) => s.openDialog);

  const subteamMap = useMemo(
    () => new Map(subteams.map((s) => [s._id, s])),
    [subteams],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (q) {
        const hay = `${m.name} ${m.username} ${m.primaryRole ?? ""} ${m.expertiseTags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterSubteam !== "all" && !m.subteamIds.includes(filterSubteam)) return false;
      if (filterPermission !== "all" && m.permission !== filterPermission) return false;
      return true;
    });
  }, [members, search, filterSubteam, filterPermission]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="size-6" /> People
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>
        {meCanEdit && (
          <Button onClick={() => openDialog("create-member")}>
            <Plus className="size-4 mr-2" /> Add member
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, role..."
              className="pl-9"
            />
          </div>
          <Select
            value={filterSubteam as string}
            onValueChange={(v) => v && setFilterSubteam(v as typeof filterSubteam)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Subteam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subteams</SelectItem>
              {subteams.map((st) => (
                <SelectItem key={st._id} value={st._id}>
                  {st.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPermission} onValueChange={(v) => v && setFilterPermission(v)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Permission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All permissions</SelectItem>
              {PERMISSION_LEVELS.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>
                  {PERMISSION_LABEL[lvl]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((m) => (
          <Link key={m._id} to={`/people/${m._id}`} className="block">
            <Card className="hover:border-primary/40 hover:shadow-sm transition">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>{initialsOf(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{m.username}
                      {m.primaryRole ? ` · ${m.primaryRole}` : ""}
                    </div>
                  </div>
                  <PermissionBadge level={m.permission} />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {m.subteamIds.map((sid) => {
                    const st = subteamMap.get(sid);
                    if (!st) return null;
                    return (
                      <span
                        key={sid}
                        className="inline-flex items-center gap-1.5 text-xs rounded-full border px-2 py-0.5 bg-muted/50"
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: st.color ?? "var(--primary)" }}
                        />
                        {st.name}
                      </span>
                    );
                  })}
                  {m.subteamIds.length === 0 && (
                    <span className="text-xs text-muted-foreground">No subteam</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <StatusBadge status={m.status} />
                  <span>Updated {relativeTime(m.lastUpdatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No matching members.
            </CardContent>
          </Card>
        )}
      </div>

      <CreateMemberDialog />
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PermissionBadge } from "@/components/permission-badge";
import { StatusBadge } from "@/components/status-badge";
import { api } from "../../convex/_generated/api";
import {
  canEdit,
  isManager,
  LOGIN_ACCESS,
  LOGIN_ACCESS_LABEL,
  type LoginAccess,
  type PermissionLevel,
} from "@/lib/constants";
import { initialsOf } from "@/lib/format";

export function AccessPage() {
  const members = useQuery(api.members.list) ?? [];
  const me = useQuery(api.members.me);
  const update = useMutation(api.members.update);
  const mePerm = me?.member?.permission as PermissionLevel | undefined;
  const meCanEdit = canEdit(mePerm);
  const meIsManager = isManager(mePerm);

  const [tab, setTab] = useState<LoginAccess | "all">("all");

  const filtered = members.filter((m) => tab === "all" || m.loginAccess === tab);

  async function setAccess(id: string, value: LoginAccess) {
    try {
      await update({
        id: id as Parameters<typeof update>[0]["id"],
        loginAccess: value,
      });
      toast.success("Access updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update access.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <KeyRound className="size-6" /> Access & login
        </h1>
        <p className="text-sm text-muted-foreground">
          Central account system. Future internal apps can reuse these identities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4" /> Shared login foundation
          </CardTitle>
          <CardDescription>
            These accounts will sign in to other team apps (scouting, battery tracking, etc).
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All ({members.length})</TabsTrigger>
          {LOGIN_ACCESS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {LOGIN_ACCESS_LABEL[s]} (
              {members.filter((m) => m.loginAccess === s).length})
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-3">
          <Card>
            <CardContent className="p-0 divide-y">
              {filtered.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nobody here.
                </div>
              )}
              {filtered.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center gap-3 p-3 flex-wrap sm:flex-nowrap"
                >
                  <Avatar className="size-9">
                    <AvatarFallback>{initialsOf(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/people/${m._id}`}
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {m.name}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate">
                      @{m.username}
                      {m.email ? ` · ${m.email}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <PermissionBadge level={m.permission} />
                    <StatusBadge status={m.status} />
                    {meCanEdit ? (
                      <Select
                        value={m.loginAccess}
                        onValueChange={(v) => setAccess(m._id, v as LoginAccess)}
                        disabled={!meIsManager && m.permission === "manager"}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LOGIN_ACCESS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {LOGIN_ACCESS_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">
                        {LOGIN_ACCESS_LABEL[m.loginAccess]}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

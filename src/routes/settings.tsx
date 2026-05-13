import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { Loader2, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "../../convex/_generated/api";
import { isManager, PERMISSION_LABEL, type PermissionLevel } from "@/lib/constants";

export function SettingsPage() {
  const me = useQuery(api.members.me);
  const workspace = useQuery(api.workspace.get);
  const rename = useMutation(api.workspace.rename);
  const { theme, setTheme } = useTheme();
  const [wsName, setWsName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspace?.name) setWsName(workspace.name);
  }, [workspace?.name]);

  const meIsManager = isManager(me?.member?.permission as PermissionLevel | undefined);

  async function onRename(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await rename({ name: wsName });
      toast.success("Workspace renamed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <SettingsIcon className="size-6" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Workspace and personal preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4" /> Your profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Name</div>
            <div className="font-medium">{me?.member?.name ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Username</div>
            <div className="font-medium">@{me?.member?.username ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Permission</div>
            <div className="font-medium">
              {me?.member?.permission
                ? PERMISSION_LABEL[me.member.permission as PermissionLevel]
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Status</div>
            <div className="font-medium capitalize">{me?.member?.status ?? "—"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
          <CardDescription>
            {meIsManager
              ? "Rename your workspace. This is the name shown in the header."
              : "Only the manager can change workspace settings."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onRename} className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-1 space-y-1.5 w-full">
              <Label htmlFor="ws-rename">Workspace name</Label>
              <Input
                id="ws-rename"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                disabled={!meIsManager}
              />
            </div>
            <Button type="submit" disabled={!meIsManager || saving}>
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Pick the theme that's easiest on your eyes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-w-xs">
            <Label>Theme</Label>
            <Select value={theme ?? "system"} onValueChange={(v) => v && setTheme(v)}>
              <SelectTrigger>
                <SelectValue>
                  {{ system: "System", light: "Light", dark: "Dark" }[theme ?? "system"]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Future apps</CardTitle>
          <CardDescription>
            This workspace is the central account system. Future internal apps
            (scouting, battery tracking, pit scheduling, tools checkout, training records,
            task systems, meeting planning, build season coordination) can reuse these
            identities and permissions.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

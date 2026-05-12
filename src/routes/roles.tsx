import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link } from "react-router";
import { Loader2, Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionBadge } from "@/components/permission-badge";
import { api } from "../../convex/_generated/api";
import { useUI } from "@/lib/ui-store";
import {
  canEdit,
  isManager,
  PERMISSION_LABEL,
  PERMISSION_LEVELS,
  type PermissionLevel,
} from "@/lib/constants";
import { initialsOf } from "@/lib/format";
import type { Id } from "../../convex/_generated/dataModel";

function CreateSkillDialog() {
  const dialog = useUI((s) => s.dialog);
  const close = useUI((s) => s.closeDialog);
  const create = useMutation(api.skills.create);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await create({ name: name.trim(), category: category.trim() || undefined });
      toast.success("Skill added.");
      setName("");
      setCategory("");
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create skill.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={dialog === "create-skill"} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New skill tag</DialogTitle>
          <DialogDescription>
            Add a recognized skill or technical role that members can be tagged with.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sk-name">Name</Label>
            <Input id="sk-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sk-cat">Category (optional)</Label>
            <Input
              id="sk-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Programming, Build, Media..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RolesPage() {
  const members = useQuery(api.members.list) ?? [];
  const skills = useQuery(api.skills.list) ?? [];
  const me = useQuery(api.members.me);
  const meCanEdit = canEdit(me?.member?.permission as PermissionLevel | undefined);
  const meIsManager = isManager(me?.member?.permission as PermissionLevel | undefined);
  const removeSkill = useMutation(api.skills.remove);
  const openDialog = useUI((s) => s.openDialog);

  async function onRemoveSkill(id: Id<"skills">, name: string) {
    if (!confirm(`Delete skill "${name}"?`)) return;
    try {
      await removeSkill({ id });
      toast.success("Skill removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete skill.");
    }
  }

  const byPermission = PERMISSION_LEVELS.map((level) => ({
    level,
    members: members.filter((m) => m.permission === level),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Shield className="size-6" /> Roles & expertise
        </h1>
        <p className="text-sm text-muted-foreground">
          Leadership authority is separate from technical expertise.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leadership permission levels</CardTitle>
            <CardDescription>
              Manager and mentor can edit. Manager controls permission changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {byPermission.map(({ level, members: ms }) => (
              <div key={level} className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-2">
                  <PermissionBadge level={level} />
                  <span className="text-xs text-muted-foreground">
                    {ms.length} {ms.length === 1 ? "person" : "people"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ms.map((m) => (
                    <Link
                      key={m._id}
                      to={`/people/${m._id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs hover:bg-accent"
                    >
                      <Avatar className="size-4">
                        <AvatarFallback className="text-[8px]">
                          {initialsOf(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      {m.name}
                    </Link>
                  ))}
                  {ms.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Nobody at this level yet.
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {level === "manager" && "Highest control. Configures permissions for everyone."}
                  {level === "mentor" && "18+, helps run the team. Can edit member profiles."}
                  {level === "team_lead" && "Senior leadership across the team."}
                  {level === "subteam_lead" && "Runs one or two subteams."}
                  {level === "sme" && "Recognized expert without leadership authority."}
                  {level === "member" && "Standard team member."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Skill tags</CardTitle>
              <CardDescription>Technical expertise, separate from authority.</CardDescription>
            </div>
            {meCanEdit && (
              <Button size="sm" onClick={() => openDialog("create-skill")}>
                <Plus className="size-4 mr-2" /> Add skill
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {skills.length === 0 && (
              <p className="text-sm text-muted-foreground">No skill tags yet.</p>
            )}
            {skills.map((sk) => {
              const tagged = members.filter((m) => m.skillIds.includes(sk._id));
              return (
                <div
                  key={sk._id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{sk.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {sk.category ?? "Uncategorized"} · {tagged.length} tagged
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tagged.slice(0, 3).map((m) => (
                      <Avatar key={m._id} className="size-6">
                        <AvatarFallback className="text-[10px]">
                          {initialsOf(m.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {tagged.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{tagged.length - 3}
                      </span>
                    )}
                    {meIsManager && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onRemoveSkill(sk._id, sk.name)}
                        aria-label="Delete skill"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Subject matter experts</CardTitle>
            <CardDescription>
              Recognized for technical depth, not necessarily leaders.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {members.filter((m) => m.isSME).length === 0 && (
              <p className="text-sm text-muted-foreground">No SMEs designated yet.</p>
            )}
            {members
              .filter((m) => m.isSME)
              .map((m) => (
                <Link
                  key={m._id}
                  to={`/people/${m._id}`}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-accent"
                >
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">
                      {initialsOf(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  {m.name}
                  {m.primaryRole && (
                    <Badge variant="outline" className="text-xs">
                      {m.primaryRole}
                    </Badge>
                  )}
                </Link>
              ))}
          </CardContent>
        </Card>
      </div>

      <CreateSkillDialog />

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground">
          Permission levels available: {PERMISSION_LEVELS.map((l) => PERMISSION_LABEL[l]).join(" · ")}
        </CardContent>
      </Card>
    </div>
  );
}

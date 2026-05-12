import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from "@/components/color-picker";
import { api } from "../../convex/_generated/api";
import { useUI } from "@/lib/ui-store";
import { canEdit, isManager, type PermissionLevel } from "@/lib/constants";
import { initialsOf } from "@/lib/format";
import { Link } from "react-router";
import type { Doc, Id } from "../../convex/_generated/dataModel";

const DEFAULT_COLOR = "#3b82f6";

function CreateSubteamDialog() {
  const dialog = useUI((s) => s.dialog);
  const close = useUI((s) => s.closeDialog);
  const create = useMutation(api.subteams.create);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (dialog === "create-subteam") {
      setName("");
      setDescription("");
      setColor(DEFAULT_COLOR);
    }
  }, [dialog]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await create({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      toast.success("Subteam created.");
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create subteam.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={dialog === "create-subteam"} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New subteam</DialogTitle>
          <DialogDescription>Pick a color and a name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="st-name">Name</Label>
            <Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-desc">Description</Label>
            <Textarea
              id="st-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
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

function EditSubteamDialog({
  subteam,
  open,
  onOpenChange,
}: {
  subteam: Doc<"subteams"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useMutation(api.subteams.update);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (subteam && open) {
      setName(subteam.name);
      setDescription(subteam.description ?? "");
      setColor(subteam.color ?? DEFAULT_COLOR);
    }
  }, [subteam, open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subteam) return;
    setSubmitting(true);
    try {
      await update({
        id: subteam._id,
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      toast.success("Subteam updated.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update subteam.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit subteam</DialogTitle>
          <DialogDescription>Rename, recolor, or update the description.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="est-name">Name</Label>
            <Input id="est-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="est-desc">Description</Label>
            <Textarea
              id="est-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SubteamsPage() {
  const summary = useQuery(api.analytics.summary);
  const subteamsData = useQuery(api.subteams.list) ?? [];
  const members = useQuery(api.members.list) ?? [];
  const me = useQuery(api.members.me);
  const meCanEdit = canEdit(me?.member?.permission as PermissionLevel | undefined);
  const meIsManager = isManager(me?.member?.permission as PermissionLevel | undefined);
  const removeSubteam = useMutation(api.subteams.remove);
  const openDialog = useUI((s) => s.openDialog);
  const [editingId, setEditingId] = useState<Id<"subteams"> | null>(null);

  async function onRemove(id: Id<"subteams">, name: string) {
    if (!confirm(`Delete subteam "${name}"? Members will keep their other assignments.`))
      return;
    try {
      await removeSubteam({ id });
      toast.success("Subteam removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete subteam.");
    }
  }

  if (!summary) {
    return <div className="text-sm text-muted-foreground">Loading subteams...</div>;
  }

  const editingSubteam = subteamsData.find((s) => s._id === editingId) ?? null;
  const subteamMap = new Map(subteamsData.map((s) => [s._id, s]));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <UsersRound className="size-6" /> Subteams
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize members by area of focus. Tap a subteam to edit its color.
          </p>
        </div>
        {meCanEdit && (
          <Button onClick={() => openDialog("create-subteam")}>
            <Plus className="size-4 mr-2" /> New subteam
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {summary.subteamCounts.map((st) => {
          const stMembers = members.filter((m) => m.subteamIds.includes(st._id));
          const full = subteamMap.get(st._id);
          return (
            <Card key={st._id}>
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2 min-w-0">
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: st.color ?? "var(--primary)" }}
                    />
                    <span className="truncate">{st.name}</span>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {meCanEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit subteam"
                        onClick={() => setEditingId(st._id)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    {meIsManager && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete subteam"
                        onClick={() => onRemove(st._id, st.name)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {st.count} member{st.count === 1 ? "" : "s"} ·{" "}
                  {st.leads.length > 0
                    ? `Lead: ${st.leads.map((l) => l.name).join(", ")}`
                    : "No lead"}
                  {st.smes.length > 0 ? ` · ${st.smes.length} SME${st.smes.length === 1 ? "" : "s"}` : ""}
                </CardDescription>
                {full?.description && (
                  <p className="text-xs text-muted-foreground pt-1">{full.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {stMembers.slice(0, 8).map((m) => (
                  <Link
                    key={m._id}
                    to={`/people/${m._id}`}
                    className="flex items-center gap-3 rounded-md border p-2 hover:bg-accent"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px]">
                        {initialsOf(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.primaryRole ?? "Member"}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {m.leadOfSubteamIds.includes(st._id) && (
                        <Badge variant="secondary" className="text-xs">Lead</Badge>
                      )}
                      {m.isSME && <Badge variant="outline" className="text-xs">SME</Badge>}
                    </div>
                  </Link>
                ))}
                {stMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                )}
                {stMembers.length > 8 && (
                  <p className="text-xs text-muted-foreground">
                    + {stMembers.length - 8} more
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
        {summary.subteamCounts.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No subteams yet. Create one to get started.
            </CardContent>
          </Card>
        )}
      </div>

      <CreateSubteamDialog />
      <EditSubteamDialog
        subteam={editingSubteam}
        open={editingId !== null}
        onOpenChange={(o) => !o && setEditingId(null)}
      />
    </div>
  );
}

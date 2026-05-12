import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link } from "react-router";
import { Loader2, Pin, PinOff, Plus, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "../../convex/_generated/api";
import { useUI } from "@/lib/ui-store";
import { canEdit, type PermissionLevel } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import type { Id } from "../../convex/_generated/dataModel";

type NoteKind =
  | "member"
  | "skill"
  | "role_change"
  | "reminder"
  | "setup"
  | "access"
  | "general";

const NOTE_KINDS: NoteKind[] = [
  "general",
  "member",
  "skill",
  "role_change",
  "reminder",
  "setup",
  "access",
];

const NOTE_KIND_LABEL: Record<NoteKind, string> = {
  member: "Member",
  skill: "Skill",
  role_change: "Role change",
  reminder: "Reminder",
  setup: "Setup issue",
  access: "Access issue",
  general: "General",
};

function CreateNoteDialog() {
  const dialog = useUI((s) => s.dialog);
  const close = useUI((s) => s.closeDialog);
  const members = useQuery(api.members.list) ?? [];
  const create = useMutation(api.notes.create);

  const [memberId, setMemberId] = useState<string>("none");
  const [kind, setKind] = useState<NoteKind>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await create({
        memberId: memberId === "none" ? undefined : (memberId as Id<"members">),
        kind,
        title: title || undefined,
        body,
        pinned,
      });
      toast.success("Note saved.");
      setTitle("");
      setBody("");
      setPinned(false);
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save note.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={dialog === "create-note"} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New note</DialogTitle>
          <DialogDescription>
            Capture context that's useful when reviewing the team later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as NoteKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {NOTE_KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Member (optional)</Label>
              <Select value={memberId} onValueChange={(v) => v && setMemberId(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No member</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-title">Title (optional)</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-body">Note</Label>
            <Textarea
              id="note-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="size-4"
            />
            Pin this note to the top
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !body.trim()}>
              {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Save note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NotesPage() {
  const notes = useQuery(api.notes.list, {}) ?? [];
  const members = useQuery(api.members.list) ?? [];
  const me = useQuery(api.members.me);
  const meCanEdit = canEdit(me?.member?.permission as PermissionLevel | undefined);
  const openDialog = useUI((s) => s.openDialog);
  const toggle = useMutation(api.notes.togglePinned);
  const remove = useMutation(api.notes.remove);

  const memberMap = new Map(members.map((m) => [m._id, m]));
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <StickyNote className="size-6" /> Notes
          </h1>
          <p className="text-sm text-muted-foreground">
            Reminders, setup issues, and internal context for managers and mentors.
          </p>
        </div>
        {meCanEdit && (
          <Button onClick={() => openDialog("create-note")}>
            <Plus className="size-4 mr-2" /> New note
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {sorted.map((n) => {
          const m = n.memberId ? memberMap.get(n.memberId) : null;
          return (
            <Card key={n._id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {n.title ?? NOTE_KIND_LABEL[n.kind]}
                    </CardTitle>
                    <CardDescription>
                      <span className="inline-flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {NOTE_KIND_LABEL[n.kind]}
                        </Badge>
                        {m && (
                          <Link
                            to={`/people/${m._id}`}
                            className="hover:underline text-foreground"
                          >
                            {m.name}
                          </Link>
                        )}
                        <span>{relativeTime(n.createdAt)}</span>
                      </span>
                    </CardDescription>
                  </div>
                  {meCanEdit && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggle({ id: n._id })}
                        aria-label="Toggle pin"
                      >
                        {n.pinned ? (
                          <PinOff className="size-4" />
                        ) : (
                          <Pin className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove({ id: n._id })}
                        aria-label="Delete note"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">{n.body}</CardContent>
            </Card>
          );
        })}
        {sorted.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No notes yet.
            </CardContent>
          </Card>
        )}
      </div>

      <CreateNoteDialog />
    </div>
  );
}

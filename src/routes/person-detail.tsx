import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Mail,
  Pencil,
  Phone,
  ShieldAlert,
  Trash2,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PermissionBadge } from "@/components/permission-badge";
import { StatusBadge } from "@/components/status-badge";
import { MemberForm } from "@/components/member-form";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useUI } from "@/lib/ui-store";
import {
  canEdit,
  isManager,
  LOGIN_ACCESS_LABEL,
  type PermissionLevel,
} from "@/lib/constants";
import { initialsOf, relativeTime } from "@/lib/format";

export function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const memberId = params.id as Id<"members"> | undefined;
  const member = useQuery(
    api.members.getById,
    memberId ? { id: memberId } : "skip",
  );
  const subteams = useQuery(api.subteams.list) ?? [];
  const skills = useQuery(api.skills.list) ?? [];
  const me = useQuery(api.members.me);
  const activity = useQuery(
    api.activity.forMember,
    memberId ? { memberId, limit: 20 } : "skip",
  );
  const notes = useQuery(
    api.notes.list,
    memberId ? { memberId } : "skip",
  );
  const remove = useMutation(api.members.remove);

  const dialog = useUI((s) => s.dialog);
  const openDialog = useUI((s) => s.openDialog);
  const closeDialog = useUI((s) => s.closeDialog);

  if (member === undefined) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }
  if (member === null) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" onClick={() => navigate("/people")}>
          <ArrowLeft className="size-4 mr-2" /> Back to people
        </Button>
        <p className="text-sm text-muted-foreground">Member not found.</p>
      </div>
    );
  }

  const mePerm = me?.member?.permission as PermissionLevel | undefined;
  const meCanEdit = canEdit(mePerm);
  const meIsManager = isManager(mePerm);
  const subteamMap = new Map(subteams.map((s) => [s._id, s]));
  const skillMap = new Map(skills.map((s) => [s._id, s]));
  const memberSubteams = member.subteamIds.map((id) => subteamMap.get(id)).filter(Boolean);
  const memberLeads = member.leadOfSubteamIds.map((id) => subteamMap.get(id)).filter(Boolean);
  const memberSkills = member.skillIds.map((id) => skillMap.get(id)).filter(Boolean);

  async function onDelete() {
    if (!member) return;
    if (!confirm(`Remove ${member.name} from the team? This cannot be undone.`)) return;
    try {
      await remove({ id: member._id });
      toast.success("Member removed.");
      navigate("/people");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove member.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/people" className={buttonVariants({ variant: "ghost" })}>
          <ArrowLeft className="size-4 mr-2" /> Back to people
        </Link>
        {meCanEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openDialog("edit-member", member._id)}>
              <Pencil className="size-4 mr-2" /> Edit
            </Button>
            {meIsManager && member.permission !== "manager" && (
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="size-4 mr-2" /> Remove
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">{initialsOf(member.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl truncate">{member.name}</CardTitle>
            <div className="text-sm text-muted-foreground">
              @{member.username}
              {member.primaryRole ? ` · ${member.primaryRole}` : ""}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <PermissionBadge level={member.permission} />
              <StatusBadge status={member.status} />
              {member.isMentor && member.permission !== "manager" && (
                <Badge variant="outline">Mentor</Badge>
              )}
              {member.isTeamLead && member.permission !== "manager" && member.permission !== "team_lead" && (
                <Badge variant="outline">Team Lead</Badge>
              )}
              {member.isSubteamLead && member.permission !== "subteam_lead" && (
                <Badge variant="outline">Subteam Lead</Badge>
              )}
              {member.isSME && <Badge variant="outline">SME</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {member.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <a href={`mailto:${member.email}`} className="hover:underline truncate">
                {member.email}
              </a>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              <span>{member.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-muted-foreground" />
            <span>Login access: {LOGIN_ACCESS_LABEL[member.loginAccess]}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCircle className="size-4 text-muted-foreground" />
            <span>Updated {relativeTime(member.lastUpdatedAt)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subteams</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {memberSubteams.length === 0 && (
              <p className="text-sm text-muted-foreground">No subteams assigned.</p>
            )}
            {memberSubteams.map((st) =>
              st ? (
                <Link
                  key={st._id}
                  to="/subteams"
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-accent"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: st.color ?? "var(--primary)" }}
                  />
                  {st.name}
                  {memberLeads.find((l) => l && l._id === st._id) && (
                    <Badge variant="secondary" className="ml-1 text-xs">Lead</Badge>
                  )}
                </Link>
              ) : null,
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills & expertise</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {memberSkills.map((sk) =>
              sk ? (
                <Badge key={sk._id} variant="outline" className="text-xs">
                  {sk.name}
                </Badge>
              ) : null,
            )}
            {member.expertiseTags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs capitalize">
                {t}
              </Badge>
            ))}
            {memberSkills.length === 0 && member.expertiseTags.length === 0 && (
              <p className="text-sm text-muted-foreground">No skills recorded.</p>
            )}
          </CardContent>
        </Card>

        {member.bio && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{member.bio}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Internal notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(notes ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
            {(notes ?? []).map((n) => (
              <div key={n._id} className="rounded-md border p-2">
                {n.title && <div className="text-sm font-medium">{n.title}</div>}
                <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {relativeTime(n.createdAt)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(activity ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {(activity ?? []).map((a) => (
              <div key={a._id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{a.summary}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {relativeTime(a.createdAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={dialog === "edit-member"}
        onOpenChange={(o) => !o && closeDialog()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {member.name}</DialogTitle>
            <DialogDescription>
              Update profile, permissions, subteams, and skills.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="overflow-hidden">
              <MemberForm member={member} meIsManager={meIsManager} onDone={closeDialog} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  LOGIN_ACCESS,
  LOGIN_ACCESS_LABEL,
  MEMBER_STATUSES,
  MEMBER_STATUS_LABEL,
  PERMISSION_LABEL,
  PERMISSION_LEVELS,
  type LoginAccess,
  type MemberStatus,
  type PermissionLevel,
} from "@/lib/constants";

type Member = Doc<"members">;

export function MemberForm({
  member,
  meIsManager,
  onDone,
}: {
  member?: Member;
  meIsManager: boolean;
  onDone: () => void;
}) {
  const adminCreate = useMutation(api.members.adminCreate);
  const update = useMutation(api.members.update);
  const subteams = useQuery(api.subteams.list) ?? [];
  const skills = useQuery(api.skills.list) ?? [];

  const [name, setName] = useState(member?.name ?? "");
  const [username, setUsername] = useState(member?.username ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [permission, setPermission] = useState<PermissionLevel>(
    member?.permission ?? "member",
  );
  const [primaryRole, setPrimaryRole] = useState(member?.primaryRole ?? "");
  const [status, setStatus] = useState<MemberStatus>(member?.status ?? "pending");
  const [loginAccess, setLoginAccess] = useState<LoginAccess>(
    member?.loginAccess ?? "pending",
  );
  const [isSME, setIsSME] = useState(member?.isSME ?? false);
  const [subteamIds, setSubteamIds] = useState<Id<"subteams">[]>(
    member?.subteamIds ?? [],
  );
  const [leadOfSubteamIds, setLeadOfSubteamIds] = useState<Id<"subteams">[]>(
    member?.leadOfSubteamIds ?? [],
  );
  const [skillIds, setSkillIds] = useState<Id<"skills">[]>(member?.skillIds ?? []);
  const [expertiseInput, setExpertiseInput] = useState(
    (member?.expertiseTags ?? []).join(", "),
  );
  const [bio, setBio] = useState(member?.bio ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!member) return;
    setName(member.name);
    setUsername(member.username);
    setEmail(member.email ?? "");
    setPhone(member.phone ?? "");
    setPermission(member.permission);
    setPrimaryRole(member.primaryRole ?? "");
    setStatus(member.status);
    setLoginAccess(member.loginAccess);
    setIsSME(member.isSME);
    setSubteamIds(member.subteamIds);
    setLeadOfSubteamIds(member.leadOfSubteamIds);
    setSkillIds(member.skillIds);
    setExpertiseInput(member.expertiseTags.join(", "));
    setBio(member.bio ?? "");
  }, [member]);

  function toggleSubteam(id: Id<"subteams">) {
    setSubteamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  function toggleLead(id: Id<"subteams">) {
    setLeadOfSubteamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  function toggleSkill(id: Id<"skills">) {
    setSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const expertiseTags = expertiseInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (member) {
        await update({
          id: member._id,
          name,
          username,
          email: email || undefined,
          phone: phone || undefined,
          permission,
          primaryRole: primaryRole || undefined,
          status,
          loginAccess,
          isSME,
          subteamIds,
          leadOfSubteamIds,
          skillIds,
          expertiseTags,
          bio: bio || undefined,
          isSubteamLead: leadOfSubteamIds.length > 0,
        });
        toast.success("Member updated.");
      } else {
        await adminCreate({
          name,
          username,
          email: email || undefined,
          phone: phone || undefined,
          permission,
          primaryRole: primaryRole || undefined,
          status,
          subteamIds,
          skillIds,
          expertiseTags,
          bio: bio || undefined,
        });
        toast.success("Member created.");
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Permission level</Label>
          <Select
            value={permission}
            onValueChange={(v) => setPermission(v as PermissionLevel)}
            disabled={!meIsManager && Boolean(member)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERMISSION_LEVELS.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>
                  {PERMISSION_LABEL[lvl]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!meIsManager && member ? (
            <p className="text-xs text-muted-foreground">
              Only the manager can change permission.
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="primary-role">Primary role</Label>
          <Input
            id="primary-role"
            value={primaryRole}
            onChange={(e) => setPrimaryRole(e.target.value)}
            placeholder="e.g. Programmer, CAD lead"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as MemberStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEMBER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {MEMBER_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Login access</Label>
          <Select value={loginAccess} onValueChange={(v) => setLoginAccess(v as LoginAccess)}>
            <SelectTrigger>
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
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="sme-toggle" className="text-sm font-medium">
            Subject matter expert
          </Label>
          <p className="text-xs text-muted-foreground">
            Recognize this person as a domain expert without making them a lead.
          </p>
        </div>
        <Switch id="sme-toggle" checked={isSME} onCheckedChange={setIsSME} />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Subteams</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {subteams.map((st) => (
            <label
              key={st._id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent text-sm"
            >
              <Checkbox
                checked={subteamIds.includes(st._id)}
                onCheckedChange={() => toggleSubteam(st._id)}
              />
              <span>{st.name}</span>
            </label>
          ))}
          {subteams.length === 0 && (
            <p className="text-xs text-muted-foreground col-span-full">
              No subteams yet. Create one from the Subteams page.
            </p>
          )}
        </div>
      </div>

      {subteamIds.length > 0 && (
        <div className="space-y-2">
          <Label>Lead of subteam(s)</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {subteams
              .filter((st) => subteamIds.includes(st._id))
              .map((st) => (
                <label
                  key={st._id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                >
                  <Checkbox
                    checked={leadOfSubteamIds.includes(st._id)}
                    onCheckedChange={() => toggleLead(st._id)}
                  />
                  <span>{st.name}</span>
                </label>
              ))}
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <Label>Skill tags</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {skills.map((sk) => (
            <label
              key={sk._id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent text-sm"
            >
              <Checkbox
                checked={skillIds.includes(sk._id)}
                onCheckedChange={() => toggleSkill(sk._id)}
              />
              <span className="truncate">{sk.name}</span>
            </label>
          ))}
          {skills.length === 0 && (
            <p className="text-xs text-muted-foreground col-span-full">
              No skill tags yet. Create one from the Roles page.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expertise">Custom expertise tags (comma separated)</Label>
        <Input
          id="expertise"
          value={expertiseInput}
          onChange={(e) => setExpertiseInput(e.target.value)}
          placeholder="welding, CNC, scouting"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Notes / bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Internal notes about this person."
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
          {member ? "Save changes" : "Create member"}
        </Button>
      </div>
    </form>
  );
}

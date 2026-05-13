import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2, LogOut, ShieldCheck, Sparkles, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PERMISSION_LABEL, type PermissionLevel } from "@/lib/constants";

type SetupState = {
  isAuthenticated: boolean;
  hasWorkspace: boolean;
  hasMembers: boolean;
  memberCount: number;
  workspaceName: string | null;
  meExists: boolean;
  mePermission: string | null;
};

export function SetupPage({ state }: { state: SetupState }) {
  const createWorkspace = useMutation(api.workspace.create);
  const claimManager = useMutation(api.members.claimManager);
  const createSelf = useMutation(api.members.createSelfMember);
  const claimExisting = useMutation(api.members.claimExistingMember);
  const unclaimed = useQuery(api.members.listUnclaimed) ?? [];
  const { signOut } = useAuthActions();

  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("1466 Robotics");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // "new" = create a fresh profile, "existing" = claim a pre-made one
  const [joinMode, setJoinMode] = useState<"new" | "existing">("new");
  const [selectedMemberId, setSelectedMemberId] = useState<Id<"members"> | null>(null);

  const step: "workspace" | "claim" | "join" = !state.hasWorkspace
    ? "workspace"
    : !state.hasMembers
    ? "claim"
    : "join";

  async function onCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setSubmitting(true);
    try {
      await createWorkspace({ name: workspaceName.trim() });
      toast.success(`Workspace "${workspaceName}" created.`);
    } catch (err) {
      toast.error("Could not create workspace.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function onClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;
    setSubmitting(true);
    try {
      await claimManager({ name: name.trim(), username: username.trim() });
      toast.success("You are now the manager.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to claim manager.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function onJoinNew(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;
    setSubmitting(true);
    try {
      await createSelf({ name: name.trim(), username: username.trim() });
      toast.success("Welcome! Your account is pending review.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function onClaimExisting(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMemberId) return;
    setSubmitting(true);
    try {
      await claimExisting({ memberId: selectedMemberId });
      toast.success("Profile linked! Welcome.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to claim profile.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            {step === "join" ? <Sparkles className="size-6" /> : <ShieldCheck className="size-6" />}
          </div>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === "workspace" && "Create workspace"}
              {step === "claim" && "Claim manager role"}
              {step === "join" && "Join the team"}
            </CardTitle>
            <CardDescription>
              {step === "workspace" &&
                "Set the name for your team's workspace. You can rename it later."}
              {step === "claim" &&
                "You're the first to sign in. Claim the manager role to set up your team."}
              {step === "join" &&
                `Welcome to ${state.workspaceName ?? "the team"}. Tell us who you are.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "workspace" && (
              <form onSubmit={onCreateWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ws-name">Workspace name</Label>
                  <Input
                    id="ws-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Create workspace
                </Button>
              </form>
            )}

            {step === "claim" && (
              <form onSubmit={onClaim} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                    required
                    placeholder="janedoe"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Claim manager role
                </Button>
              </form>
            )}

            {step === "join" && (
              <div className="space-y-4">
                {/* Mode toggle — only show "I'm already listed" if there are unclaimed profiles */}
                {unclaimed.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={joinMode === "existing" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setJoinMode("existing")}
                    >
                      <UserCheck className="size-4 mr-2" /> I'm already listed
                    </Button>
                    <Button
                      type="button"
                      variant={joinMode === "new" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setJoinMode("new")}
                    >
                      <UserPlus className="size-4 mr-2" /> Create new profile
                    </Button>
                  </div>
                )}

                {/* Claim an existing unclaimed profile */}
                {joinMode === "existing" && unclaimed.length > 0 && (
                  <form onSubmit={onClaimExisting} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select the profile that was created for you. Only profiles
                      that haven't been claimed yet are shown.
                    </p>
                    <div className="space-y-2">
                      {unclaimed.map((m) => (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => setSelectedMemberId(m._id)}
                          className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent ${
                            selectedMemberId === m._id
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                        >
                          <div>
                            <div className="text-sm font-medium">{m.name}</div>
                            <div className="text-xs text-muted-foreground">@{m.username}</div>
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">
                            {PERMISSION_LABEL[m.permission as PermissionLevel]}
                          </span>
                        </button>
                      ))}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting || !selectedMemberId}
                    >
                      {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                      This is me
                    </Button>
                  </form>
                )}

                {/* Create a brand new profile */}
                {joinMode === "new" && (
                  <form onSubmit={onJoinNew} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full name</Label>
                      <Input
                        id="full-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                        required
                        placeholder="janedoe"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                      Join team
                    </Button>
                  </form>
                )}
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full mt-3"
              onClick={() => signOut()}
            >
              <LogOut className="size-4 mr-2" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

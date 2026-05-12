import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SignInPage() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    data.set("flow", mode);
    try {
      await signIn("password", data);
    } catch (err) {
      toast.error(
        mode === "signIn"
          ? "Sign-in failed. Check your email and password."
          : "Sign-up failed. The email may already be in use.",
      );
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
            <ShieldCheck className="size-6" />
          </div>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Team Account Manager</CardTitle>
            <CardDescription>
              Sign in to your team workspace or create an account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "signIn" | "signUp")}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="signIn">
                  <LogIn className="size-4 mr-2" /> Sign in
                </TabsTrigger>
                <TabsTrigger value="signUp">
                  <UserPlus className="size-4 mr-2" /> Sign up
                </TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="you@team1466.org"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : null}
                  {mode === "signIn" ? "Sign in" : "Create account"}
                </Button>
              </form>
              <TabsContent value="signIn" className="text-xs text-muted-foreground text-center mt-4">
                The first person to sign up will be able to claim manager.
              </TabsContent>
              <TabsContent value="signUp" className="text-xs text-muted-foreground text-center mt-4">
                Passwords must be at least 8 characters.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

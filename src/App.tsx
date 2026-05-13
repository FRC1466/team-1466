import { Navigate, Route, Routes } from "react-router";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "../convex/_generated/api";
import { SignInPage } from "@/routes/sign-in";
import { SetupPage } from "@/routes/setup";
import { AppLayout } from "@/components/app-layout";
import { DashboardPage } from "@/routes/dashboard";
import { PeoplePage } from "@/routes/people";
import { PersonDetailPage } from "@/routes/person-detail";
import { SubteamsPage } from "@/routes/subteams";
import { RolesPage } from "@/routes/roles";
import { AnalyticsPage } from "@/routes/analytics";
import { AccessPage } from "@/routes/access";
import { SettingsPage } from "@/routes/settings";
import { NotesPage } from "@/routes/notes";
import { AppsPage } from "@/routes/apps";

function FullPageSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function GuardedShell() {
  const setup = useQuery(api.workspace.setupState);

  if (setup === undefined) return <FullPageSpinner label="Loading workspace..." />;

  if (!setup.hasWorkspace || !setup.meExists) {
    return <SetupPage state={setup} />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/people/:id" element={<PersonDetailPage />} />
        <Route path="/subteams" element={<SubteamsPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/access" element={<AccessPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/apps" element={<AppsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <>
      <AuthLoading>
        <FullPageSpinner label="Authenticating..." />
      </AuthLoading>
      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
      <Authenticated>
        <GuardedShell />
      </Authenticated>
    </>
  );
}

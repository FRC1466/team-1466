# Adding a New App Connected to team-1466

This guide covers everything needed to connect a new external app so that it
uses team-1466 as its identity and permission source — the same way WebbPower
does.

---

## How the connection works

```
User signs into New App
        │
        ▼
New App calls team-1466's /internal/member-lookup  (HTTP action, shared secret)
        │
        ▼
team-1466 returns: { found, permission, status, loginAccess }
        │
        ▼
New App maps permission → its own role and saves it
```

team-1466 is the **source of truth** for:
- Whether a person exists on the team
- Their permission level (manager → mentor → team_lead → subteam_lead → sme → member)
- Whether their login access is enabled, pending, or disabled
- Whether they are active, inactive, pending, or alumni

The new app manages its **own Convex deployment, its own auth, and its own
database** — team-1466 only answers "who is this person and what can they do?"

---

## Step 1 — Add the app card to the Apps page in team-1466

Open `src/routes/apps.tsx` and add a new card inside the grid:

```tsx
import { YourIcon } from "lucide-react";

// Add to the grid:
<a href={YOUR_APP_URL} target="_blank" rel="noopener noreferrer" className="block outline-none group focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
  <Card className="h-full transition-colors hover:border-primary/50 group-hover:bg-muted/50 border-border">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
          <YourIcon className="size-5" />
        </div>
        <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <CardTitle className="text-xl">Your App Name</CardTitle>
      <CardDescription className="text-balance leading-relaxed">
        One-sentence description of what the app does.
      </CardDescription>
    </CardHeader>
  </Card>
</a>
```

Add the URL constant to `src/components/app-layout.tsx` alongside `WEBBPOWER_URL`:

```ts
export const YOUR_APP_URL =
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_YOUR_APP_URL ?? "https://your-app.vercel.app";
```

Then set `VITE_YOUR_APP_URL` in Vercel → team-1466 project → Environment Variables.

---

## Step 2 — The `/internal/member-lookup` endpoint already exists

`convex/http.ts` already exposes the endpoint. Nothing to change there.
It accepts:

```
POST /internal/member-lookup
Headers: x-api-key: <TEAM_DASHBOARD_API_KEY>
Body:    { "email": "user@example.com" }
```

Response when found:
```json
{
  "found": true,
  "permission": "mentor",
  "name": "Jane Smith",
  "status": "active",
  "loginAccess": "enabled"
}
```

Response when not found:
```json
{ "found": false }
```

---

## Step 3 — Set environment variables

### Generate a shared secret (do this once per app)
```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Set on team-1466's Convex deployment
```powershell
cd c:\Github\Other\team-1466
bunx convex env set TEAM_DASHBOARD_API_KEY "your-generated-secret"
```
> If team-1466 already has `TEAM_DASHBOARD_API_KEY` set (from WebbPower), you
> can reuse the same key for all connected apps, or use a separate key per app
> (more secure). Either works — the endpoint just checks that the header matches.

### Set on the new app's Convex deployment
```powershell
cd c:\Github\path\to\new-app
bunx convex env set TEAM_DASHBOARD_URL "https://befitting-lemur-331.convex.site"
bunx convex env set TEAM_DASHBOARD_API_KEY "your-generated-secret"
```

> **team-1466's Convex site URL** (needed by the new app to call the endpoint):
> `https://befitting-lemur-331.convex.site`
> Find it any time: `cd team-1466 && bunx convex env get CONVEX_SITE_URL`

---

## Step 4 — Implement the sync action in the new app

In `convex/users.ts` (or wherever auth lives in the new app), add:

```typescript
import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

/** Map team-1466 permission levels to your app's roles. Adjust as needed. */
function permissionToRole(permission: string): "admin" | "editor" | "viewer" {
  if (permission === "manager" || permission === "mentor") return "admin";
  if (permission === "team_lead" || permission === "subteam_lead") return "editor";
  return "viewer";
}

export const syncRoleFromTeamDashboard = action({
  args: {},
  handler: async (ctx): Promise<{ synced: boolean; role?: string; reason?: string }> => {
    const dashboardUrl = process.env.TEAM_DASHBOARD_URL;
    const apiKey = process.env.TEAM_DASHBOARD_API_KEY;
    if (!dashboardUrl) return { synced: false };

    const user = await ctx.runQuery(api.users.currentUser);
    if (!user?.email || user.isAnonymous) return { synced: false };

    try {
      const res = await fetch(`${dashboardUrl}/internal/member-lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-api-key": apiKey } : {}),
        },
        body: JSON.stringify({ email: user.email }),
      });
      if (!res.ok) return { synced: false };

      const data = await res.json() as {
        found: boolean;
        permission?: string;
        status?: string;
        loginAccess?: string;
      };

      if (!data.found || !data.permission) return { synced: false, reason: "not_found" };
      if (data.status === "inactive" || data.status === "alumni") return { synced: false, reason: "inactive" };
      if (data.loginAccess === "disabled") return { synced: false, reason: "login_disabled" };
      if (data.loginAccess === "pending")  return { synced: false, reason: "login_pending" };

      const role = permissionToRole(data.permission);
      await ctx.runMutation(api.users.upsertOwnRole, { role });
      return { synced: true, role };
    } catch {
      return { synced: false };
    }
  },
});
```

---

## Step 5 — Call the sync action after sign-in

In your sign-in component, call `syncRole()` immediately after `signIn(...)`:

```tsx
const syncRole = useAction(api.users.syncRoleFromTeamDashboard);

async function handleSignIn(e) {
  await signIn("password", formData);
  const result = await syncRole();
  if (result.synced) {
    toast.success(`Signed in — role: ${result.role}`);
  } else if (result.reason === "not_found") {
    toast.warning("Email not found in team-1466. Ask an admin to add you.");
  } else if (result.reason === "login_disabled") {
    toast.warning("Your login access is disabled in the team dashboard.");
  }
  navigate("/");
}
```

Also add a **Resync** button somewhere in the UI (user menu, settings page, etc.)
so users can re-sync without signing out.

---

## Step 6 — Verify it works

1. Make sure the user's email in your new app **exactly matches** their email in
   team-1466 (same address, same case — the lookup is case-insensitive on the
   team-1466 side).
2. Sign in to the new app and watch for the success toast.
3. If it fails, check:
   - `TEAM_DASHBOARD_URL` points to the `.convex.site` URL (not `.convex.cloud`)
   - Both apps have the same `TEAM_DASHBOARD_API_KEY` value
   - The user's `loginAccess` in team-1466 is set to `"enabled"`

---

## Permission mapping reference

| team-1466 permission | Suggested new-app role |
|---|---|
| `manager` | `admin` |
| `mentor` | `admin` |
| `team_lead` | editor / pit / elevated |
| `subteam_lead` | editor / pit / elevated |
| `sme` | viewer |
| `member` | viewer |

You can define any role names you want — just implement the mapping in
`permissionToRole()` in your app.

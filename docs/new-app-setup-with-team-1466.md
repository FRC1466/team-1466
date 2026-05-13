# Integrating team-1466 from the Start (New App Setup)

Use this guide when **starting a new app from scratch** that should use
team-1466 as its identity and permission source. This is faster than
retrofitting it later.

Stack this guide assumes:
- Bun, Vite, React, TypeScript
- Convex for backend
- `@convex-dev/auth` with Password provider
- React Router 7 (SPA mode)
- shadcn/ui + Sonner for toasts

---

## 1 — Scaffold the project

```powershell
bun create vite MY_APP --template react-ts
cd MY_APP
bun add react-router convex zustand next-themes lucide-react sonner
bun add -d tailwindcss @tailwindcss/vite
bunx shadcn@latest init
bunx shadcn@latest add sonner button card input label separator
bun add @convex-dev/auth
bunx convex dev   # creates the Convex deployment, sets VITE_CONVEX_URL in .env.local
```

---

## 2 — Configure Convex Auth

```powershell
bunx @convex-dev/auth
```

This generates `JWT_PRIVATE_KEY` and `JWKS` and sets them on your deployment.

In `convex/auth.ts`:
```typescript
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
```

In `convex/auth.config.ts`:
```typescript
export default {
  providers: [
    { domain: process.env.CONVEX_SITE_URL, applicationID: "convex" },
  ],
};
```

In `convex/http.ts`:
```typescript
import { httpRouter } from "convex/server";
import { auth } from "./auth";
const http = httpRouter();
auth.addHttpRoutes(http);
export default http;
```

---

## 3 — Add roles to the schema

In `convex/schema.ts`, include `authTables` and a `roles` table:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  roles: defineTable({
    userId: v.id("users"),
    // Define whatever roles your app needs:
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  }).index("by_user", ["userId"]),

  // ...rest of your schema
});
```

---

## 4 — Add the team-1466 sync action

Create (or add to) `convex/users.ts`:

```typescript
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

/** Adjust this mapping to your app's role names. */
function permissionToRole(permission: string): "admin" | "editor" | "viewer" {
  if (permission === "manager" || permission === "mentor") return "admin";
  if (permission === "team_lead" || permission === "subteam_lead") return "editor";
  return "viewer";
}

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const role = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return {
      _id: user._id,
      email: (user as { email?: string }).email,
      name: (user as { name?: string }).name,
      isAnonymous: (user as { isAnonymous?: boolean }).isAnonymous ?? false,
      role: role?.role ?? "viewer",
    };
  },
});

export const upsertOwnRole = mutation({
  args: { role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    // Never downgrade — only upgrade.
    const RANK = { admin: 2, editor: 1, viewer: 0 } as const;
    if (existing && RANK[existing.role] >= RANK[args.role]) return;
    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
    } else {
      await ctx.db.insert("roles", { userId, role: args.role });
    }
  },
});

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

## 5 — Set environment variables

### Generate a shared secret
```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Set on your new app's Convex deployment
```powershell
# team-1466's Convex site URL (the .convex.site one, not .convex.cloud)
bunx convex env set TEAM_DASHBOARD_URL "https://befitting-lemur-331.convex.site"
bunx convex env set TEAM_DASHBOARD_API_KEY "your-generated-secret"
```

### Set on team-1466's Convex deployment
```powershell
cd c:\Github\Other\team-1466
bunx convex env set TEAM_DASHBOARD_API_KEY "your-generated-secret"
```
> Same value as above. If the key already exists from a previous app, you can
> reuse it (all connected apps share one key) or rotate it.

---

## 6 — Build the sign-in page

Make a sign-in page that:
1. Has **no** self-service "Create Account" option — accounts are managed in team-1466
2. Calls `syncRoleFromTeamDashboard` immediately after `signIn`
3. Shows a clear message if the email isn't found or access is disabled

```tsx
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const REASON_MESSAGES: Record<string, string> = {
  not_found: "Email not found in team-1466. Ask an admin to add you.",
  inactive: "Your team account is inactive. Contact a team admin.",
  login_disabled: "Your login access is disabled. Contact a team admin.",
  login_pending: "Your login access is pending approval.",
};

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const syncRole = useAction(api.users.syncRoleFromTeamDashboard);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("flow", "signIn");
    try {
      await signIn("password", formData);
      const result = await syncRole();
      if (result.synced) {
        toast.success(`Signed in — role: ${result.role}`);
      } else if (result.reason) {
        toast.warning(REASON_MESSAGES[result.reason] ?? "Role not synced.", { duration: 8000 });
      }
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    }
  }

  // render your form...
}
```

---

## 7 — Add the app to team-1466's Apps page

Once your app is deployed, open `c:\Github\Other\team-1466\src\routes\apps.tsx`
and follow the instructions in `adding-a-new-connected-app.md` (Step 1) to add
a card linking to it.

---

## 8 — Vercel env vars (production)

In Vercel → your new app project → Settings → Environment Variables:

| Key | Value |
|---|---|
| `VITE_CONVEX_URL` | Set automatically if you link Convex to Vercel |
| `VITE_TEAM_DASHBOARD_URL` | `https://team-1466.vercel.app` (for the sign-in page link) |

The `TEAM_DASHBOARD_URL` and `TEAM_DASHBOARD_API_KEY` Convex env vars are set
via `bunx convex env set` and do **not** go in Vercel — they live in the Convex
dashboard.

---

## Checklist

- [ ] `convex/schema.ts` includes `...authTables` and a `roles` table
- [ ] `convex/auth.ts` exports `convexAuth` with `Password` provider
- [ ] `convex/auth.config.ts` uses `CONVEX_SITE_URL`
- [ ] `convex/http.ts` has `auth.addHttpRoutes(http)`
- [ ] `convex/users.ts` has `syncRoleFromTeamDashboard`, `upsertOwnRole`, `currentUser`
- [ ] `TEAM_DASHBOARD_URL` set on your Convex deployment
- [ ] `TEAM_DASHBOARD_API_KEY` set on your Convex deployment AND team-1466's deployment
- [ ] Sign-in page calls `syncRole()` after `signIn()`
- [ ] No self-service account creation on the sign-in page
- [ ] App card added to team-1466's `/apps` page

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Internal API used by WebbPower to look up a member's permission level by
// email so it can auto-assign the correct WebbPower role on sign-in.
// Protected by a shared secret: set TEAM_DASHBOARD_API_KEY in both apps.
http.route({
  path: "/internal/member-lookup",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const apiKey = process.env.TEAM_DASHBOARD_API_KEY;
    if (apiKey) {
      const authHeader = request.headers.get("x-api-key");
      if (authHeader !== apiKey) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const email = body.email?.toLowerCase().trim();
    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delegate DB access to an internal query (actions can't use ctx.db).
    const result = await ctx.runQuery(internal.members.lookupByEmail, { email });

    if (!result) {
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        found: true,
        permission: result.permission,
        name: result.name,
        status: result.status,
        loginAccess: result.loginAccess,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }),
});

export default http;

# FRC Team 1466 — Webb Robotics Team Manager

Internal team management app for FRC Team 1466 Webb Robotics. Handles member accounts, subteams, roles, permissions, notes, and analytics.

**Live app:** https://team-1466.vercel.app

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (Base UI)
- **Backend:** [Convex](https://convex.dev) — database, functions, real-time sync
- **Auth:** `@convex-dev/auth` with password-based login
- **Deployment:** Vercel (frontend) + Convex Cloud (backend)

## Features

- Member directory with profiles, subteam assignments, roles, and permissions
- Subteam management (Code, Electrical, CAD, Mechanical, Composites, Business, Strategy, Scouting, Impact, Imagery)
- Role-based access control (Manager, Mentor, Team Lead, Subteam Lead, SME, Member)
- Notes system with pinning
- Activity feed and analytics dashboard
- PWA — installable on iOS and Android

## Local Development

### Prerequisites

- [Bun](https://bun.sh)
- A [Convex](https://dashboard.convex.dev) account

### Setup

```bash
bun install
bun run dev:all
```

On first run, Convex will prompt you to log in and create a deployment. The app will be at http://localhost:5173.

Convex automatically manages `.env.local` with your dev deployment URL. Do not commit this file.

## Deployment

The app deploys automatically on every push to `main` via GitHub Actions → Vercel. The Vercel build command also deploys Convex functions to production as part of each build.

### Required GitHub secrets

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

### Required Vercel env vars

| Variable | Description |
|---|---|
| `VITE_CONVEX_URL` | Convex prod deployment URL |
| `CONVEX_DEPLOY_KEY` | Convex prod deploy key |

### Required Convex env vars (prod)

| Variable | Description |
|---|---|
| `SITE_URL` | Your Vercel domain (for auth callbacks) |

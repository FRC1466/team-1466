# FRC Team 1466 — Webb Robotics Team Manager# React + TypeScript + Vite



Internal team management app for FRC Team 1466 Webb Robotics. Handles member accounts, subteams, roles, permissions, notes, and analytics.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



**Live app:** https://team-1466.vercel.appCurrently, two official plugins are available:



---- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)

- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Tech Stack

## React Compiler

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (Base UI)

- **Backend:** [Convex](https://convex.dev) — database, functions, real-time syncThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

- **Auth:** `@convex-dev/auth` with password-based login

- **Deployment:** Vercel (frontend) + Convex Cloud (backend)## Expanding the ESLint configuration



## FeaturesIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:



- Member directory with profiles, subteam assignments, roles, and permissions```js

- Subteam management (Code, Electrical, CAD, Mechanical, Composites, Business, Strategy, Scouting, Impact, Imagery)export default defineConfig([

- Role-based access control (Manager, Mentor, Team Lead, Subteam Lead, SME, Member)  globalIgnores(['dist']),

- Notes system with pinning  {

- Activity feed and analytics dashboard    files: ['**/*.{ts,tsx}'],

- PWA — installable on iOS and Android    extends: [

      // Other configs...

## Local Development

      // Remove tseslint.configs.recommended and replace with this

### Prerequisites      tseslint.configs.recommendedTypeChecked,

      // Alternatively, use this for stricter rules

- [Bun](https://bun.sh)      tseslint.configs.strictTypeChecked,

- A [Convex](https://dashboard.convex.dev) account      // Optionally, add this for stylistic rules

      tseslint.configs.stylisticTypeChecked,

### Setup

      // Other configs...

```bash    ],

# Install dependencies    languageOptions: {

bun install      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

# Start Convex dev backend + Vite dev server together        tsconfigRootDir: import.meta.dirname,

bun run dev:all      },

```      // other options...

    },

On first run, Convex will prompt you to log in and create a deployment. The app will be at `http://localhost:5173`.  },

])

### Environment```



Convex automatically manages `.env.local` with your dev deployment URL. Do not commit this file.You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:



## Deployment```js

// eslint.config.js

The app deploys automatically on every push to `main` via GitHub Actions → Vercel.import reactX from 'eslint-plugin-react-x'

import reactDom from 'eslint-plugin-react-dom'

The Vercel build command (`bunx convex deploy --cmd 'bun run build'`) also deploys Convex functions to production as part of each build.

export default defineConfig([

### Required secrets (GitHub → Settings → Secrets)  globalIgnores(['dist']),

  {

| Secret | Description |    files: ['**/*.{ts,tsx}'],

|---|---|    extends: [

| `VERCEL_TOKEN` | Vercel API token |      // Other configs...

| `VERCEL_ORG_ID` | Vercel team/org ID |      // Enable lint rules for React

| `VERCEL_PROJECT_ID` | Vercel project ID |      reactX.configs['recommended-typescript'],

      // Enable lint rules for React DOM

### Required env vars (Vercel project settings)      reactDom.configs.recommended,

    ],

| Variable | Description |    languageOptions: {

|---|---|      parserOptions: {

| `VITE_CONVEX_URL` | Convex prod deployment URL |        project: ['./tsconfig.node.json', './tsconfig.app.json'],

| `CONVEX_DEPLOY_KEY` | Convex prod deploy key |        tsconfigRootDir: import.meta.dirname,

      },

### Required Convex env vars (prod deployment)      // other options...

    },

| Variable | Description |  },

|---|---|])

| `SITE_URL` | Your Vercel domain (for auth callbacks) |```


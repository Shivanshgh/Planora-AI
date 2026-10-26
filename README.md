# Planora AI

Planora AI is a React and Express event-planning assistant for weddings, birthday parties, and community events. It uses Gemini to generate event plans and keeps saved plans in the browser's local storage.

## Features

- Guided event planning form with wedding, birthday, and community presets.
- Gemini-generated event overview, INR budget, preparation timeline, checklist, ideas, and risks.
- Editable saved event budgets and checklist/timeline status tracking.
- AI section regeneration, budget suggestions, creative ideas, and a contextual assistant.
- Dashboard, event duplication and deletion, sample plans, and print-friendly plan view.

Sample plans are demonstration data. They are marked as samples and are not live AI output or vendor quotes.

## Technology and architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Backend:** Express 4 and `tsx`, which serves the Vite middleware in development and `dist` in production.
- **AI:** Google `@google/genai` SDK; Gemini API calls and `GEMINI_API_KEY` remain on the server.
- **Validation:** Zod validates event-generation inputs and the request bodies for the AI planning endpoints. Gemini structured output is used for generated sections; the application recalculates full-plan budget allocations.
- **Persistence:** Browser `localStorage`; plans are local to the browser and do not sync across devices.

The browser calls the same-origin `/api/*` endpoints. Express serves the built single-page application and uses a SPA fallback in production.
After deployment, visitors need only a web browser; Node.js, Bun, and project dependencies are required only in the build and server environments.

## Prerequisites

- Node.js 20.19+ or 22.12+ (Vite 8 requirement).
- Bun (the repository includes `bun.lock`).
- A Gemini API key for live AI features. Without it, saved sample plans and non-AI UI features remain available.

## Setup

```sh
bun install --frozen-lockfile
```

Copy `.env.example` to `.env` and set your server-side Gemini key:

```env
GEMINI_API_KEY=your_key_here
PORT=3000
```

Do not put the key in frontend variables or commit `.env`.

## Development and production

```sh
# Development: Express and Vite middleware on port 3000 by default
bun run dev

# TypeScript check
bun run lint

# Schema validation tests
bun run test

# Build the frontend into dist/
bun run build

# Production: serve dist/ and /api/* through Express
NODE_ENV=production bun run start
```

On Windows PowerShell, set production mode for the current session with `$env:NODE_ENV='production'` before `bun run start`. The `PORT` environment variable selects the listening port. `/api/health` reports server status, configured-key presence, and model name; it does not verify that the key is accepted by Google.

## Deployment (Render)

Use a Render **Web Service** with the Node runtime; a static site cannot run the Express API. The checked-in [`render.yaml`](./render.yaml) defines the service commands, health check, production mode, and Bun version. Render includes Bun when `bun.lock` is present; its official guide documents `BUN_VERSION` for pinning the version.

1. Connect the Git repository and use the `render.yaml` Blueprint.
2. Enter a valid Gemini key when Render prompts for `GEMINI_API_KEY`.
3. After deploy, confirm `/api/health` and the app page load. Then test Gemini generation with a valid key.

The service must install dependencies including `tsx`, because the current production start script runs `server.ts` directly. Render supplies the public URL and forwards requests to the Express process, which binds to `0.0.0.0` and serves both the API and built frontend. Deployment and public publishing have not been performed from this workspace.

## Repository layout

```text
src/components/   React views and event workflows
src/services/     API client and localStorage persistence
src/types/        Event types and request schema
src/utils/        Formatting and clearly identified sample plans
server.ts         Express API, Gemini integration, static serving
```

## Known limitations

- Saved events exist only in the current browser profile; there is no account or cloud sync.
- Live Gemini behavior requires a valid key and network access and has not been verified without credentials.
- AI endpoints validate bounded request fields, but this public demo does not include API rate limiting; add a provider-aware limiter before exposing a costly AI service broadly.
- The checked-in folder currently has no `.git` directory, so tracked-file/secret inspection and a GitHub repository size check require the original Git checkout.
- The available environment did not include Bun, npm, installed dependencies, or a package lock for npm, so build and runtime commands need to be run in an environment with the project's dependencies installed.

## Walkthrough demo script (about 3:30)

- **0:00–0:20 — Intro:** Introduce Planora AI and the wedding, birthday, and community planning use case.
- **0:20–0:45 — Start an event:** Choose Birthday, enter a date, city, guest count, and budget, then submit a plan request.
- **0:45–1:20 — Generated plan:** Show the overview and personalized suggestions; identify that the plan was generated live if Gemini is configured.
- **1:20–1:55 — Budget:** Review INR allocations, edit one expense, and show the updated totals.
- **1:55–2:25 — Timeline and checklist:** Review deadlines and mark a checklist item complete.
- **2:25–2:55 — AI feature:** Demonstrate budget optimization or regenerate one plan section.
- **2:55–3:15 — Saved event:** Refresh, reopen the event, then briefly show edit/duplicate/delete controls.
- **3:15–3:30 — Close:** Show the running application and print view.

## License

Apache-2.0

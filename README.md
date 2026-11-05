# Limitless Deal Hub

An educational React and Three.js car showroom with a customizable 12-car collection, a city driving game and database-backed accounts.

[Live website](https://comp-graph-project.vercel.app/) · [Vehicle comparison](https://comp-graph-project.vercel.app/compare?cars=7,9,11)

## Documentation

- [Project documentation](docs/PROJECT_DOCUMENTATION.md) covers setup, user workflows, graphics, APIs, database structure, deployment and troubleshooting. [PDF version](docs/PROJECT_DOCUMENTATION.pdf).
- [Project proposal](docs/PROJECT_PROPOSAL.md) explains the academic aim, scope, approach, evaluation criteria and development plan. [PDF version](docs/PROJECT_PROPOSAL.pdf).
- [Presentation tutorial](docs/PRESENTATION_TUTORIAL.md) provides a timed English talk, live demo steps, fallback plan and likely questions. Target duration is 5 to 10 minutes. [PDF version](docs/PRESENTATION_TUTORIAL.pdf).
- [Editable presentation](docs/Limitless_Deal_Hub_Presentation.pptx) contains nine slides with speaker notes and an approximately eight-minute running order.

## Features

- Twelve vehicles from nine brands, including Ferrari, Lamborghini, Bugatti, McLaren and Pagani.
- Interactive 3D model inspection, an assembly reveal, lighting presets and independent body, wheel and glass customization.
- A moving brand logo carousel, search, brand and powertrain filters, a browser shortlist and comparison of up to three cars.
- City driving with keyboard and touch controls, animated wheels, moving traffic and pedestrians, camera views and a day and night transition.
- Registration, sign-in, profile photos, named saved designs and account carts that return after signing in again.

## Local setup

Use Node.js **24 or newer**. Open the project root containing package.json in VS Code, then run:

```powershell
npm ci
npm run dev
```

Open **http://localhost:5173** and keep the terminal running. The launcher starts the API on port 3001 and Vite on port 5173. It creates the local SQLite database at `server/data/accounts.sqlite` automatically. Stop the session with Ctrl+C before starting another one.

To check the local backend:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/health
```

Expected values: `service: showroom-accounts` and `database: ready`.

`npm run dev:client` runs only the frontend. `npm run start:api` runs only the local account server. Normal development uses `npm run dev` so both services are available. See the documentation for port conflicts and custom environment settings.

## Controls

In City Drive, use W/S to accelerate or reverse, A/D to steer, Space to brake, C to cycle cameras and Escape to pause. Touch controls appear on phones and tablets. The scene also offers camera presets, Reset car, Speed straight and Lite graphics.

Use **Test drive my design** from the customizer to pass the selected configuration into the city. A generic collection Test drive link opens the vehicle without passing the active studio design.

## Backend and storage

Local development uses a Node HTTP server and SQLite. Production uses the Vercel function at `api/index.js` with Neon PostgreSQL. Configure `DATABASE_URL` or `POSTGRES_URL` and the intended `APP_ORIGIN` in Vercel's server environment, then redeploy. Never expose the connection string through a `VITE_` variable or commit it to Git.

Local and production accounts are separate. Account profiles, named designs and signed-in carts use the database. Guest carts, vehicle drafts and shortlists use browser storage. Signing out switches to the separate guest cart without deleting the account cart. The UI provides an explicit action to import a guest cart into an account.

The local Node launcher reads process environment variables and does not load `.env` automatically. Vite loads its own frontend environment files. `VITE_CONTACT_EMAIL` is an optional public inbox for an email handoff. The visitor must send that prepared email using their email application.

## Verification

```powershell
node --test tests/*.test.mjs
npm run build
npm run lint
```

The documented implementation baseline passed 13 regression checks and a production build. These tests cover selected behaviors rather than all devices, API flows or security properties. The current build can report a large Three.js bundle warning.

## Deployment

The GitHub main branch connects to Vercel. Vercel builds with `npm run build`, serves `dist` and deploys the API function. `vercel.json` defines the page and API rewrites. After deployment, check `/api/health` and verify a controlled account's saved designs and cart. Preserve the intended persistent Neon database branch when reviewing deployment settings.

## Scope and credits

This is an **educational prototype**. Prices are demonstration values. Checkout downloads a demo receipt and does not process payment, place orders or reserve vehicles. The contact page downloads an inquiry when no inbox is configured. Driving uses simplified physics and arcade speed settings.

Vehicle assets come from third-party artists. Some differ in year or trim from catalog specifications. See [model sources and licenses](public/models/MODEL-CREDITS.md) and [brand logo notices](public/images/brands/CREDITS.md). Licenses vary, including noncommercial restrictions on some models. Retain notices and review individual licenses before commercial redistribution.

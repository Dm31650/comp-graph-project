# Accounts and customization

Use Node.js 24 or newer. From this project folder, run npm install, then npm run dev. This starts both the account server and the website at http://localhost:5173. Stop any older Vite process first. Use localhost (not a LAN address) for this local setup.

Registration, sign-in, sign-out, profile editing, carts and saved designs use the Node API in server/, backed by Neon Postgres (server/db.mjs). Set DATABASE_URL in .env.local (provided automatically when the Neon integration is connected); tables are created on startup. Passwords are hashed with scrypt and a random salt; sessions use HttpOnly cookies and expire after seven days. There is no email verification, password recovery or email delivery configured.

The profile's Three.js wheel supports dragging, a pause button, reduced motion and a saved signature color. Vehicle designs still autosave in this browser per vehicle; they are not synced to accounts.

Wheel picking now uses individual mesh/material-slot IDs, not shared material names. Click Select wheels in 3D, click the rim pieces you want, then Finish selection. Choose Silver, Black or Gold. You can select multiple pieces. Legacy material-name assignments are discarded while paint, finish and other preferences are retained. Some imported models combine wheel and tire into one mesh; those cannot be independently recolored without editing the source model. Wheel texture maps are retained.

For public hosting on Vercel: publish the project as-is. `vercel.json` builds the Vite site and routes every `/api/*` request to the serverless function in `api/index.mjs`, which runs the same handler as the local server (`server/app.mjs`). The Neon integration supplies `DATABASE_URL`; tables are created on first request. Locally, `npm run dev` still starts the API on port 3001 (override with API_PORT). To self-host instead, run `node server/index.mjs` behind an HTTPS reverse proxy that forwards /api, with NODE_ENV=production and APP_ORIGIN set to the public origin. For production use, add email verification/recovery and operational backups. npm run preview also needs npm run start:api running separately.

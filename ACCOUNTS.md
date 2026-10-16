# Accounts and customization

Use Node.js 24 or newer. From this project folder, run npm install, then npm run dev. This starts both the account server and the website at http://localhost:5173. Stop any older Vite process first. Use localhost (not a LAN address) for this local setup.

Registration, sign-in, sign-out and profile editing use a local Node server. Profiles persist in server/data/accounts.sqlite, which is excluded from Git. Passwords are hashed with scrypt and a random salt; sessions use HttpOnly cookies and expire after seven days. Do not share the database or add it to Git. There is no email verification, password recovery or email delivery configured.

The profile's Three.js wheel supports dragging, a pause button, reduced motion and a saved signature color. Vehicle designs still autosave in this browser per vehicle; they are not synced to accounts.

Wheel picking now uses individual mesh/material-slot IDs, not shared material names. Click Select wheels in 3D, click the rim pieces you want, then Finish selection. Choose Silver, Black or Gold. You can select multiple pieces. Legacy material-name assignments are discarded while paint, finish and other preferences are retained. Some imported models combine wheel and tire into one mesh; those cannot be independently recolored without editing the source model. Wheel texture maps are retained.

For public hosting: run the account server behind an HTTPS reverse proxy that forwards /api, set NODE_ENV=production and APP_ORIGIN to the exact public origin, and mount server/data on persistent private storage. The API binds to localhost port 3001 (override with API_PORT). Use one API process with this SQLite setup. Static-only hosting cannot run accounts. For production use, add email verification/recovery and operational backups. npm run preview also needs npm run start:api running separately.

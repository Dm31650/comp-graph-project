# Online database and backend

Vercel serves the Vite frontend and api/index.js. The cloud handler uses Postgres; npm run dev continues to use the existing local SQLite backend.

Connect Neon through the project's Vercel Storage page. Set DATABASE_URL (or POSTGRES_URL) to its pooled connection URL in the production environment. Do not prefix database credentials with VITE_. Set APP_ORIGIN to https://comp-graph-project.vercel.app. Preview deployments accept their VERCEL_URL origin; use a separate database for previews if you enable them.

Tables are created automatically on the first API request using a transaction and a database lock. Existing data is not dropped. /api/health reports database readiness. Accounts, password hashes, sessions, profile photos, carts and designs are stored in Postgres. Session cookies are HttpOnly and Secure. Login throttling is stored in the database and cart writes use row locks.

The local SQLite database is not uploaded or automatically imported. Keep it private. Online accounts begin in the new database unless a deliberate migration is performed. Do not commit server/data, environment files, or database exports.

Email verification and password-recovery email are not configured. This is still an educational showroom, not a payment service.

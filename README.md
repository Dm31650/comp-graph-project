<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
=======
# comp-graph-project
>>>>>>> origin/main

## Cart and contact

- `/cart` supports original cars and separate custom-design configurations, quantities (1–10 per configuration), removal, totals, and browser-local persistence.
- Demo checkout clears the cart after confirmation and offers a downloadable text receipt. It does not send orders, process payments, or reserve vehicles.
- `/contact` validates name, email, and message. Without a configured inbox it downloads the inquiry and explicitly reports that nothing was sent.
- To connect an inbox, copy `.env.example` to `.env.local`, set `VITE_CONTACT_EMAIL` to your real address, and restart Vite (or rebuild for deployment). The form then opens a prepared email in the visitor's email app; the visitor must send it there. For server-side delivery, connect a backend or form service.
- Run regression checks with `node --test tests/*.test.mjs`, then `npm run build` and `npm run lint`.

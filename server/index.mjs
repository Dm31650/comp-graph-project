import { createServer } from 'node:http';
import { handler } from './app.mjs';

const port = Number(process.env.API_PORT || 3001);
createServer(handler).listen(port, '127.0.0.1', () => console.log(`Account server ready on port ${port} (Neon Postgres)`));

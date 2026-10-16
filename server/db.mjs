import { Pool } from '@neondatabase/serverless';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

if (!process.env.DATABASE_URL) {
 for (const name of ['.env.local', '.env.development.local', '.env']) {
  const file = fileURLToPath(new URL('../' + name, import.meta.url));
  if (existsSync(file)) process.loadEnvFile(file);
  if (process.env.DATABASE_URL) break;
 }
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set. Connect the Neon integration or add it to .env.local.');

export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
pool.on('error', error => console.error('Database pool error:', error.message));

export async function query(text, params = []) {
 return (await pool.query(text, params)).rows;
}

export async function one(text, params = []) {
 return (await query(text, params))[0] || null;
}

export async function transaction(work) {
 const client = await pool.connect();
 try {
  await client.query('BEGIN');
  const result = await work((text, params = []) => client.query(text, params).then(r => r.rows));
  await client.query('COMMIT');
  return result;
 } catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  throw error;
 } finally {
  client.release();
 }
}

export async function migrate() {
 await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
   id TEXT PRIMARY KEY,
   email TEXT UNIQUE NOT NULL,
   name TEXT NOT NULL,
   hash TEXT NOT NULL,
   salt TEXT NOT NULL,
   color TEXT NOT NULL DEFAULT '#ff6534',
   avatar TEXT,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS sessions (
   token TEXT PRIMARY KEY,
   user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   expires BIGINT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
  CREATE TABLE IF NOT EXISTS carts (
   user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
   items JSONB NOT NULL DEFAULT '[]'::jsonb
  );
  CREATE TABLE IF NOT EXISTS designs (
   id TEXT PRIMARY KEY,
   user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   car_id INTEGER NOT NULL,
   name TEXT NOT NULL,
   configuration JSONB NOT NULL,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS designs_owner ON designs(user_id);
 `);
}

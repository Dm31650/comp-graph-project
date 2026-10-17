import pg from 'pg';
let pool;
let initialization;
export function database() {
 if (!pool) {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw Object.assign(new Error('Database is not configured.'), { status: 503 });
  pool = new pg.Pool({ connectionString, max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
  pool.on('error', () => console.error('Idle database connection failed.'));
 }
 return pool;
}
export async function transaction(fn) {
 const client = await database().connect();
 try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
 catch(error) { await client.query('ROLLBACK').catch(()=>{}); throw error; }
 finally { client.release(); }
}
export async function ready() {
 if (!initialization) initialization = transaction(async client => {
  await client.query('SELECT pg_advisory_xact_lock(74382910)');
  await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, hash TEXT NOT NULL, salt TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#ff6534', avatar TEXT);
   CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires BIGINT NOT NULL);
   CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
   CREATE TABLE IF NOT EXISTS carts (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, items JSONB NOT NULL DEFAULT '[]');
   CREATE TABLE IF NOT EXISTS designs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, car_id INTEGER NOT NULL, name TEXT NOT NULL, configuration JSONB NOT NULL, updated_at TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS designs_owner ON designs(user_id);
   CREATE TABLE IF NOT EXISTS login_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires BIGINT NOT NULL);`);
 }).catch(error => {initialization = undefined; throw error;});
 await initialization;
}

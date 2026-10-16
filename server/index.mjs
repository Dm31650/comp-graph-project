import { cleanCart, cartReducer, normalizeDesign } from '../src/cart/cart.js';
import { cars } from '../src/data/cars.js';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('./data/', import.meta.url));
mkdirSync(directory, { recursive: true });
const db = new DatabaseSync(directory + '/accounts.sqlite');
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, hash TEXT NOT NULL, salt TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#ff6534');
 CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);`);
db.exec(`CREATE TABLE IF NOT EXISTS carts (user_id TEXT PRIMARY KEY REFERENCES users(id), items TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS designs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), car_id INTEGER NOT NULL, name TEXT NOT NULL, configuration TEXT NOT NULL, updated_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS designs_owner ON designs(user_id);`);
if (!db.prepare('PRAGMA table_info(users)').all().some(column => column.name === 'avatar')) db.exec('ALTER TABLE users ADD COLUMN avatar TEXT');
const derive = promisify(scrypt);
const digest = token => createHash('sha256').update(token).digest('hex');
const publicUser = u => u ? { id: u.id, name: u.name, email: u.email, color: u.color, avatar: u.avatar || null } : null;
const secure = process.env.NODE_ENV === 'production';
const origin = process.env.APP_ORIGIN || 'http://localhost:5173';
const attempts = new Map();
setInterval(() => { const now = Date.now(); for (const [key, value] of attempts) if (value.until < now) attempts.delete(key); db.prepare('DELETE FROM sessions WHERE expires < ?').run(now); }, 60000).unref();
const cookie = (token, age = 604800) => `showroom_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure ? '; Secure' : ''}`;
const fail = (status, message) => Object.assign(new Error(message), { status });
async function body(req) {
 let text = ''; for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 262144) throw fail(413, 'Request too large.'); }
 try { const value = JSON.parse(text); if (!value || typeof value !== 'object' || Array.isArray(value)) throw 0; return value; } catch { throw fail(400, 'Invalid request.'); }
}
createServer(async (req, res) => {
 const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); };
 try {
  const path = new URL(req.url, origin).pathname;
  if (req.method !== 'GET' && req.headers.origin !== origin) throw fail(403, 'Request origin not allowed.');
  const token = /(?:^|;\s*)showroom_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  const user = token ? db.prepare('SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE token=? AND expires>?').get(digest(token), Date.now()) : null;
  if (path === '/api/health' && req.method === 'GET') { db.prepare('SELECT 1').get(); return send(200, { service: 'showroom-accounts', database: 'ready' }); }
  if (path === '/api/me' && req.method === 'GET') return send(200, { user: publicUser(user) });
  if (path === '/api/logout' && req.method === 'POST') { if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token)); res.setHeader('Set-Cookie', cookie('', 0)); return send(200, { user: null }); }
  if (['/api/register', '/api/login'].includes(path) && req.method === 'POST') {
   const key = req.socket.remoteAddress;
   const rate = attempts.get(key) || { count: 0, until: Date.now() + 900000 }; attempts.set(key, rate);
   if (++rate.count > 20) throw fail(429, 'Too many attempts. Please try again in 15 minutes.');
   const input = await body(req);
   const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
   const password = input.password;
   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || password.length < 10 || password.length > 128) throw fail(400, 'Use a valid email and a password of 10–128 characters.');
   let account;
   if (path === '/api/register') {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (name.length < 2 || name.length > 60) throw fail(400, 'Your name must be 2–60 characters.');
    const salt = randomBytes(16).toString('hex'); const hash = (await derive(password, salt, 64)).toString('hex');
    const id = randomBytes(16).toString('hex');
    try { db.prepare('INSERT INTO users (id,email,name,hash,salt) VALUES (?,?,?,?,?)').run(id,email,name,hash,salt); } catch (error) { if (String(error).includes('UNIQUE')) throw fail(409, 'Unable to register this email. Try signing in.'); throw error; }
    account = db.prepare('SELECT * FROM users WHERE id=?').get(id);
   } else {
    account = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const hash = await derive(password, account?.salt || 'invalid-account-salt', 64);
    if (!account || !timingSafeEqual(hash, Buffer.from(account.hash, 'hex'))) throw fail(401, 'Email or password is incorrect.');
   }
   if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));
   const session = randomBytes(32).toString('hex');
   db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(session), account.id, Date.now() + 604800000);
   res.setHeader('Set-Cookie', cookie(session)); return send(200, { user: publicUser(account) });
  }
  if (path === '/api/cart') {
   if (!user) throw fail(401, 'Please sign in first.');
   let items = cleanCart(JSON.parse(db.prepare('SELECT items FROM carts WHERE user_id=?').get(user.id)?.items || '[]'));
   if (req.method === 'POST') {
    const action = await body(req);
    if (!['add','remove','quantity','clear','import'].includes(action.type)) throw fail(400, 'Invalid cart action.');
    // Re-read after the request body awaits so concurrent requests cannot overwrite each other.
    items = cleanCart(JSON.parse(db.prepare('SELECT items FROM carts WHERE user_id=?').get(user.id)?.items || '[]'));
    items = action.type === 'import' ? cleanCart([...items, ...cleanCart(action.items)]) : cartReducer(items, action);
    if (items.length > 100) throw fail(400, 'Your cart can hold up to 100 configurations.');
    db.prepare('INSERT INTO carts VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET items=excluded.items').run(user.id, JSON.stringify(items));
   } else if (req.method !== 'GET') throw fail(405, 'Method not allowed.');
   return send(200, { items });
  }
  if (path === '/api/designs') {
   if (!user) throw fail(401, 'Please sign in first.');
   if (req.method === 'POST') {
    const input = await body(req);
    if (!cars.some(car => car.id === input.carId) || !input.design || typeof input.design !== 'object' || typeof input.name !== 'string' || input.name.trim().length < 1 || input.name.length > 80) throw fail(400, 'Choose a vehicle and a design name of 1–80 characters.');
    if (db.prepare('SELECT COUNT(*) AS count FROM designs WHERE user_id=?').get(user.id).count >= 100) throw fail(400, 'You can save up to 100 designs.');
    db.prepare('INSERT INTO designs VALUES (?,?,?,?,?,?)').run(randomBytes(16).toString('hex'), user.id, input.carId, input.name.trim(), JSON.stringify(normalizeDesign(input.design)), new Date().toISOString());
   } else if (req.method === 'DELETE') {
    const input = await body(req);
    if (typeof input.id !== 'string') throw fail(400, 'Choose a saved design.');
    db.prepare('DELETE FROM designs WHERE id=? AND user_id=?').run(input.id, user.id);
   } else if (req.method !== 'GET') throw fail(405, 'Method not allowed.');
   const designs = db.prepare('SELECT id, car_id AS carId, name, configuration, updated_at AS updatedAt FROM designs WHERE user_id=? ORDER BY updated_at DESC').all(user.id).map(({configuration,...row}) => ({...row, design: normalizeDesign(JSON.parse(configuration))}));
   return send(200, { designs });
  }
  if (path === '/api/profile' && req.method === 'PATCH') {
   if (!user) throw fail(401, 'Please sign in first.');
   const { name, color, avatar } = await body(req);
   if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60 || !/^#[a-f0-9]{6}$/i.test(color || '')) throw fail(400, 'Enter a name of 2–60 characters and a valid color.');
   if (avatar !== undefined && avatar !== null) {
    if (typeof avatar !== 'string' || avatar.length > 160000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar)) throw fail(400, 'Choose a valid profile photo.');
    const bytes = Buffer.from(avatar.split(',')[1], 'base64');
    if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes.at(-2) !== 255 || bytes.at(-1) !== 217) throw fail(400, 'Invalid profile photo.');
   }
   db.prepare('UPDATE users SET name=?, color=?, avatar=? WHERE id=?').run(name.trim(),color,avatar === undefined ? user.avatar : avatar,user.id);
   return send(200, { user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id)) });
  }
  send(404, { error: 'Not found.' });
 } catch (error) { if (!error.status) console.error(error); send(error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' }); }
}).listen(Number(process.env.API_PORT || 3001), '127.0.0.1', () => console.log('Account server ready on port ' + (process.env.API_PORT || 3001)));

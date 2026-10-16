import { cleanCart, cartReducer, normalizeDesign } from '../src/cart/cart.js';
import { cars } from '../src/data/cars.js';
import { createServer } from 'node:http';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { query, one, transaction, migrate } from './db.mjs';

await migrate();

const derive = promisify(scrypt);
const digest = token => createHash('sha256').update(token).digest('hex');
const publicUser = u => u ? { id: u.id, name: u.name, email: u.email, color: u.color, avatar: u.avatar || null } : null;
const secure = process.env.NODE_ENV === 'production';
const origin = process.env.APP_ORIGIN || 'http://localhost:5173';
function allowedOrigin(req) {
 const requestOrigin = req.headers.origin;
 if (!requestOrigin) return false;
 if (requestOrigin === origin) return true;
 try {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return Boolean(host) && new URL(requestOrigin).host === host;
 } catch { return false; }
}
const attempts = new Map();
setInterval(() => {
 const now = Date.now();
 for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
 query('DELETE FROM sessions WHERE expires < $1', [now]).catch(error => console.error('Session cleanup failed:', error.message));
}, 60000).unref();
const cookie = (token, age = 604800) => `showroom_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure ? '; Secure' : ''}`;
const fail = (status, message) => Object.assign(new Error(message), { status });
async function body(req) {
 let text = ''; for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 262144) throw fail(413, 'Request too large.'); }
 try { const value = JSON.parse(text); if (!value || typeof value !== 'object' || Array.isArray(value)) throw 0; return value; } catch { throw fail(400, 'Invalid request.'); }
}
const listDesigns = async userId => (await query('SELECT id, car_id AS "carId", name, configuration, updated_at AS "updatedAt" FROM designs WHERE user_id=$1 ORDER BY updated_at DESC', [userId]))
 .map(({ configuration, updatedAt, ...row }) => ({ ...row, updatedAt: new Date(updatedAt).toISOString(), design: normalizeDesign(configuration) }));

createServer(async (req, res) => {
 const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); };
 try {
  const path = new URL(req.url, origin).pathname;
  if (req.method !== 'GET' && !allowedOrigin(req)) throw fail(403, 'Request origin not allowed.');
  const token = /(?:^|;\s*)showroom_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  const user = token ? await one('SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE token=$1 AND expires>$2', [digest(token), Date.now()]) : null;
  if (path === '/api/health' && req.method === 'GET') { await one('SELECT 1'); return send(200, { service: 'showroom-accounts', database: 'ready' }); }
  if (path === '/api/me' && req.method === 'GET') return send(200, { user: publicUser(user) });
  if (path === '/api/logout' && req.method === 'POST') { if (token) await query('DELETE FROM sessions WHERE token=$1', [digest(token)]); res.setHeader('Set-Cookie', cookie('', 0)); return send(200, { user: null }); }
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
    account = await one('INSERT INTO users (id,email,name,hash,salt) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING RETURNING *', [randomBytes(16).toString('hex'), email, name, hash, salt]);
    if (!account) throw fail(409, 'Unable to register this email. Try signing in.');
   } else {
    account = await one('SELECT * FROM users WHERE email=$1', [email]);
    const hash = await derive(password, account?.salt || 'invalid-account-salt', 64);
    if (!account || !timingSafeEqual(hash, Buffer.from(account.hash, 'hex'))) throw fail(401, 'Email or password is incorrect.');
   }
   if (token) await query('DELETE FROM sessions WHERE token=$1', [digest(token)]);
   const session = randomBytes(32).toString('hex');
   await query('INSERT INTO sessions (token,user_id,expires) VALUES ($1,$2,$3)', [digest(session), account.id, Date.now() + 604800000]);
   res.setHeader('Set-Cookie', cookie(session)); return send(200, { user: publicUser(account) });
  }
  if (path === '/api/cart') {
   if (!user) throw fail(401, 'Please sign in first.');
   if (req.method === 'POST') {
    const action = await body(req);
    if (!['add','remove','quantity','clear','import'].includes(action.type)) throw fail(400, 'Invalid cart action.');
    const items = await transaction(async tx => {
     await tx('INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);
     const [row] = await tx('SELECT items FROM carts WHERE user_id=$1 FOR UPDATE', [user.id]);
     const current = cleanCart(row?.items || []);
     const next = action.type === 'import' ? cleanCart([...current, ...cleanCart(action.items)]) : cartReducer(current, action);
     if (next.length > 100) throw fail(400, 'Your cart can hold up to 100 configurations.');
     await tx('UPDATE carts SET items=$2::jsonb WHERE user_id=$1', [user.id, JSON.stringify(next)]);
     return next;
    });
    return send(200, { items });
   }
   if (req.method !== 'GET') throw fail(405, 'Method not allowed.');
   return send(200, { items: cleanCart((await one('SELECT items FROM carts WHERE user_id=$1', [user.id]))?.items || []) });
  }
  if (path === '/api/designs') {
   if (!user) throw fail(401, 'Please sign in first.');
   if (req.method === 'POST') {
    const input = await body(req);
    if (!cars.some(car => car.id === input.carId) || !input.design || typeof input.design !== 'object' || typeof input.name !== 'string' || input.name.trim().length < 1 || input.name.length > 80) throw fail(400, 'Choose a vehicle and a design name of 1–80 characters.');
    const inserted = await one(`INSERT INTO designs (id,user_id,car_id,name,configuration)
     SELECT $1,$2,$3,$4,$5::jsonb WHERE (SELECT COUNT(*) FROM designs WHERE user_id=$2) < 100 RETURNING id`,
     [randomBytes(16).toString('hex'), user.id, input.carId, input.name.trim(), JSON.stringify(normalizeDesign(input.design))]);
    if (!inserted) throw fail(400, 'You can save up to 100 designs.');
   } else if (req.method === 'DELETE') {
    const input = await body(req);
    if (typeof input.id !== 'string') throw fail(400, 'Choose a saved design.');
    await query('DELETE FROM designs WHERE id=$1 AND user_id=$2', [input.id, user.id]);
   } else if (req.method !== 'GET') throw fail(405, 'Method not allowed.');
   return send(200, { designs: await listDesigns(user.id) });
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
   const updated = await one('UPDATE users SET name=$1, color=$2, avatar=$3 WHERE id=$4 RETURNING *', [name.trim(), color, avatar === undefined ? user.avatar : avatar, user.id]);
   return send(200, { user: publicUser(updated) });
  }
  send(404, { error: 'Not found.' });
 } catch (error) { if (!error.status) console.error(error); send(error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' }); }
}).listen(Number(process.env.API_PORT || 3001), '127.0.0.1', () => console.log('Account server ready on port ' + (process.env.API_PORT || 3001) + ' (Neon Postgres)'));

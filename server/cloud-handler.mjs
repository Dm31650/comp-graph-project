import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { database, ready, transaction } from './postgres.mjs';
import { cleanCart, cartReducer, normalizeDesign } from '../src/cart/cart.js';
import { cars } from '../src/data/cars.js';
const derive = promisify(scrypt);
const digest = value => createHash('sha256').update(value).digest('hex');
const fail = (status,message) => Object.assign(new Error(message),{status});
const publicUser = u => u ? {id:u.id,name:u.name,email:u.email,color:u.color,avatar:u.avatar || null} : null;
const cookie = (token,age=604800) => `showroom_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${age}`;
async function input(req) {
 let value = req.body;
 if (value === undefined) { let raw=''; for await(const chunk of req) {raw+=chunk;if(Buffer.byteLength(raw)>262144)throw fail(413,'Request too large.');} value=raw; }
 if (typeof value === 'string') {if(Buffer.byteLength(value)>262144)throw fail(413,'Request too large.');try{value=JSON.parse(value);}catch{throw fail(400,'Invalid request.');}}
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw fail(400,'Invalid request.');
 if(Buffer.byteLength(JSON.stringify(value))>262144)throw fail(413,'Request too large.');
 return value;
}
function allowedOrigin(origin) {
 const allowed = [process.env.APP_ORIGIN, process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`, process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`].filter(Boolean);
 return typeof origin==='string' && allowed.includes(origin);
}
export default async function handler(req,res) {
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 try {
  const url=new URL(req.url,'https://localhost');
  const route=url.searchParams.get('route') || url.pathname.replace(/^\/api\//,'');
  if(!['health','me','login','register','logout','profile','cart','designs'].includes(route))throw fail(404,'Not found.');
  if(req.method!=='GET' && !allowedOrigin(req.headers.origin))throw fail(403,'Request origin not allowed.');
  await ready(); const db=database();
  if(route==='health' && req.method==='GET'){await db.query('SELECT 1');return send(200,{service:'showroom-accounts',database:'ready'});}
  const token=/(?:^|;\s*)showroom_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  const user=token ? (await db.query('SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE token=$1 AND expires>$2',[digest(token),Date.now()])).rows[0] : null;
  if(route==='me' && req.method==='GET')return send(200,{user:publicUser(user)});
  if(route==='logout' && req.method==='POST'){if(token)await db.query('DELETE FROM sessions WHERE token=$1',[digest(token)]);res.setHeader('Set-Cookie',cookie('',0));return send(200,{user:null});}
  if(['register','login'].includes(route) && req.method==='POST'){
   const data=await input(req);const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';const password=data.password;
   const ip=req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
   const now=Date.now(), window=Math.floor(now/900000), expiry=(window+1)*900000;
   const key=digest(`${String(ip).split(',')[0]}:${window}`);
   const attempts=(await db.query('INSERT INTO login_limits VALUES ($1,1,$2) ON CONFLICT(key) DO UPDATE SET attempts=login_limits.attempts+1 RETURNING attempts',[key,expiry])).rows[0].attempts;
   await db.query('DELETE FROM login_limits WHERE expires<$1',[now]);
   await db.query('DELETE FROM sessions WHERE expires<$1',[now]);
   if(attempts>20){res.setHeader('Retry-After',String(Math.ceil((expiry-now)/1000)));throw fail(429,'Too many attempts. Please try again in 15 minutes.');}
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof password!=='string'||password.length<10||password.length>128)throw fail(400,'Use a valid email and a password of 10–128 characters.');
   let account;
   if(route==='register'){
    const name=typeof data.name==='string'?data.name.trim():'';if(name.length<2||name.length>60)throw fail(400,'Your name must be 2–60 characters.');
    const salt=randomBytes(16).toString('hex');const hash=(await derive(password,salt,64)).toString('hex');
    try{account=(await db.query('INSERT INTO users(id,email,name,hash,salt) VALUES($1,$2,$3,$4,$5) RETURNING *',[randomBytes(16).toString('hex'),email,name,hash,salt])).rows[0];}
    catch(error){if(error.code==='23505')throw fail(409,'Unable to register this email. Try signing in.');throw error;}
   }else{
    account=(await db.query('SELECT * FROM users WHERE email=$1',[email])).rows[0];
    const hash=await derive(password,account?.salt || 'invalid-account-salt',64);
    if(!account||!timingSafeEqual(hash,Buffer.from(account.hash,'hex')))throw fail(401,'Email or password is incorrect.');
   }
   const session=randomBytes(32).toString('hex');
   await transaction(async client=>{if(token)await client.query('DELETE FROM sessions WHERE token=$1',[digest(token)]);await client.query('INSERT INTO sessions VALUES($1,$2,$3)',[digest(session),account.id,Date.now()+604800000]);});
   res.setHeader('Set-Cookie',cookie(session));return send(200,{user:publicUser(account)});
  }
  if(!user)throw fail(401,'Please sign in first.');
  if(route==='profile' && req.method==='PATCH'){
   const {name,color,avatar}=await input(req);
   if(typeof name!=='string'||name.trim().length<2||name.trim().length>60||typeof color!=='string'||!/^#[a-f0-9]{6}$/i.test(color))throw fail(400,'Enter a valid username and color.');
   if(avatar!==undefined && avatar!==null){
    if(typeof avatar!=='string'||avatar.length>160000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar))throw fail(400,'Choose a valid profile photo.');
    const bytes=Buffer.from(avatar.split(',')[1],'base64');if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)throw fail(400,'Invalid profile photo.');
   }
   const updated=(await db.query('UPDATE users SET name=$1,color=$2,avatar=CASE WHEN $3 THEN $4 ELSE avatar END WHERE id=$5 RETURNING *',[name.trim(),color,avatar!==undefined,avatar ?? null,user.id])).rows[0];
   return send(200,{user:publicUser(updated)});
  }
  if(route==='cart'){
   if(req.method==='GET')return send(200,{items:cleanCart((await db.query('SELECT items FROM carts WHERE user_id=$1',[user.id])).rows[0]?.items || [])});
   if(req.method!=='POST')throw fail(405,'Method not allowed.');const action=await input(req);
   if(!['add','remove','quantity','clear','import'].includes(action.type))throw fail(400,'Invalid cart action.');
   const items=await transaction(async client=>{
    await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[user.id]);
    const current=cleanCart((await client.query('SELECT items FROM carts WHERE user_id=$1',[user.id])).rows[0]?.items || []);
    const next=action.type==='import'?cleanCart([...current,...cleanCart(action.items)]):cartReducer(current,action);
    if(next.length>100)throw fail(400,'Your cart can hold up to 100 configurations.');
    await client.query('INSERT INTO carts VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET items=excluded.items',[user.id,JSON.stringify(next)]);return next;
   });return send(200,{items});
  }
  if(route==='designs'){
   if(req.method==='POST'){
    const data=await input(req);
    if(!cars.some(car=>car.id===data.carId)||!data.design||typeof data.design!=='object'||typeof data.name!=='string'||!data.name.trim()||data.name.length>80)throw fail(400,'Choose a vehicle and a design name of 1–80 characters.');
    await transaction(async client=>{
     await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[user.id]);
     if(Number((await client.query('SELECT COUNT(*) AS count FROM designs WHERE user_id=$1',[user.id])).rows[0].count)>=100)throw fail(400,'You can save up to 100 designs.');
     await client.query('INSERT INTO designs VALUES($1,$2,$3,$4,$5,$6)',[randomBytes(16).toString('hex'),user.id,data.carId,data.name.trim(),JSON.stringify(normalizeDesign(data.design)),new Date().toISOString()]);
    });
   }else if(req.method==='DELETE'){
    const data=await input(req);if(typeof data.id!=='string')throw fail(400,'Choose a saved design.');await db.query('DELETE FROM designs WHERE id=$1 AND user_id=$2',[data.id,user.id]);
   }else if(req.method!=='GET')throw fail(405,'Method not allowed.');
   const designs=(await db.query('SELECT id,car_id AS "carId",name,configuration,updated_at AS "updatedAt" FROM designs WHERE user_id=$1 ORDER BY updated_at DESC',[user.id])).rows.map(({configuration,...row})=>({...row,design:normalizeDesign(configuration)}));
   return send(200,{designs});
  }
  throw fail(405,'Method not allowed.');
 }catch(error){if(!error.status)console.error('Account API failure:',error.code || error.name);send(error.status||500,{error:error.status?error.message:'Account service unavailable. Please try again.'});}
}

import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';
import SavedDesigns from '../components/SavedDesigns';

async function preparePhoto(file) {
 if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose a JPG, PNG or WebP image under 5 MB.');
 const bitmap = await createImageBitmap(file);
 try {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not prepare your photo.');
  const side = Math.min(bitmap.width,bitmap.height);
  context.fillStyle = '#161a21'; context.fillRect(0,0,256,256);
  context.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,256,256);
  return canvas.toDataURL('image/jpeg',.85);
 } finally {bitmap.close();}
}

export default function ProfileDashboard() {
 const {user,act} = useAuth(); const {pending:cartPending} = useCart();
 const [designCount,setDesignCount] = useState(null);
 const [editing,setEditing] = useState(false); const [name,setName] = useState(user.name);
 const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [notice,setNotice] = useState('');
 const input = useRef(null); const lock = useRef(false);
 const save = async values => { await act('profile','PATCH',{name:user.name,color:user.color,...values}); };
 const upload = async event => {
  const file = event.target.files?.[0]; event.target.value = ''; if(!file || lock.current)return;
  lock.current=true; setBusy(true); setError(''); setNotice('');
  try {await save({avatar:await preparePhoto(file)});setNotice('Profile photo saved.');}
  catch(error){setError(error.message);} finally{lock.current=false;setBusy(false);}
 };
 const remove = async () => {setBusy(true);setError('');try {await save({avatar:null});setNotice('Profile photo removed.');}catch(error){setError(error.message);}finally{setBusy(false);}};
 return <main className="website"><SiteHeader/><section className="profile-overview" aria-labelledby="profile-title"><div className="profile-card">
  <div className="profile-cover"><span>LIMITLESS / DRIVERS CLUB</span></div>
  <div className="profile-identity"><button className="profile-photo" type="button" disabled={busy} aria-label={user.avatar ? 'Change profile photo' : 'Add profile photo'} onClick={()=>input.current?.click()}>{user.avatar ? <img src={user.avatar} alt="Your profile"/> : <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></svg>}<span aria-hidden="true">+</span></button>
   <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload}/>
   <button className="profile-text-button" disabled={busy} onClick={()=>input.current?.click()}>{busy ? 'Please wait…' : user.avatar ? 'Change photo' : 'Add your photo'}</button>
   {user.avatar && <button className="profile-text-button subtle" disabled={busy} onClick={remove}>Remove photo</button>}
   <p className="eyebrow">MY PROFILE</p><h1 id="profile-title">{user.name}</h1><p className="profile-email">{user.email}</p>
  </div>
  <dl className="profile-facts"><div><dt>Username</dt><dd>{user.name}</dd></div><div><dt>Email address</dt><dd>{user.email}</dd></div><div><dt>Saved designs</dt><dd className="profile-count">{designCount ?? '—'}</dd></div></dl>
  {editing && <form className="profile-edit" onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');try{await save({name});setEditing(false);setNotice('Username updated.');}catch(error){setError(error.message);}finally{setBusy(false);}}}><label>Username<input value={name} onChange={event=>setName(event.target.value)} minLength={2} maxLength={60} required autoComplete="nickname" disabled={busy}/></label><button disabled={busy}>Save changes</button><button type="button" disabled={busy} onClick={()=>setEditing(false)}>Cancel</button></form>}
  {error && <p className="profile-feedback account-error" role="alert">{error}</p>}{notice && <p className="profile-feedback" role="status">{notice}</p>}
  <div className="profile-buttons"><button disabled={busy} onClick={()=>{setName(user.name);setEditing(true);}}>Edit username</button><Link to="/#collection">Create a design ↗</Link><button disabled={busy||cartPending} onClick={async()=>{setBusy(true);try{await act('logout','POST');}catch(error){setError(error.message);}finally{setBusy(false);}}}>Sign out</button></div>
 </div></section><SavedDesigns onCountChange={setDesignCount}/><SiteFooter/></main>;
}

import Icon from '../components/Icon';
import ProfileDashboard from './ProfileDashboard';
import SavedDesigns from '../components/SavedDesigns';
import { useCart } from '../cart/CartContext';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';
import DriverSculpture from '../components/DriverSculpture';
import './Account.css';

export default function Account({ mode = 'login' }) {
 const { user, loading, error: connectionError, act, refresh } = useAuth();
 const { pending: cartPending } = useCart();
 const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
 const [color, setColor] = useState(user?.color || '#ff6534');
 useEffect(() => { if (user) setColor(user.color); }, [user]);
 const register = mode === 'register'; const profile = mode === 'profile';
 if (loading) return <main className="website"><SiteHeader/><p className="account-loading" role="status">Opening your garage…</p></main>;
 if (profile && !user) return <Navigate to="/sign-in" replace/>;
 if (!profile && user) return <Navigate to="/profile" replace/>;
 if (profile) return <ProfileDashboard/>;
 const submit = async event => {
  event.preventDefault(); setError(''); setMessage(''); setBusy(true);
  const data = Object.fromEntries(new FormData(event.currentTarget));
  if (register && data.password !== data.confirm) { setError('Passwords do not match.'); setBusy(false); return; }
  try { await act(profile ? 'profile' : register ? 'register' : 'login', profile ? 'PATCH' : 'POST', profile ? { name: data.name, color } : { name: data.name, email: data.email, password: data.password }); if (profile) setMessage('Profile saved.'); }
  catch (error) { setError(error.connection ? "" : error.message); } finally { setBusy(false); }
 };
 return <main className="website"><SiteHeader/><section className="account-layout"><div className="account-art"><p className="eyebrow">LIMITLESS / DRIVERS CLUB</p><h1>{profile ? 'YOUR PRIVATE' : 'A NEW WAY'}<br/><span>{profile ? 'GARAGE.' : 'TO BELONG.'}</span></h1><DriverSculpture color={profile ? color : '#ff6534'}/></div><div className="account-panel"><p className="eyebrow">{profile ? 'DRIVER PROFILE' : register ? 'JOIN THE CLUB' : 'WELCOME BACK'}</p><h2>{profile ? `Hello, ${user.name}.` : register ? 'Create your account.' : 'Sign in.'}</h2><p>{profile ? 'Give your driver profile a personal signature.' : 'Your next chapter starts in the showroom.'}</p>
 <form onSubmit={submit} key={mode}>
 {(register || profile) && <label>Display name<input name="name" autoComplete="name" defaultValue={user?.name || ''} minLength={2} maxLength={60} required/></label>}
 <label>Email<input name="email" type="email" autoComplete="email" defaultValue={user?.email || ''} maxLength={254} required disabled={profile}/></label>
 {!profile && <label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={10} maxLength={128} required/><small>Use 10–128 characters.</small></label>}
 {register && <label>Confirm password<input name="confirm" type="password" autoComplete="new-password" minLength={10} maxLength={128} required/></label>}
 {profile && <label>Signature wheel color<input aria-label="Signature wheel color" type="color" value={color} onChange={event => setColor(event.target.value)}/></label>}
 {(error || connectionError) && <p className="account-error" role="alert">{error || connectionError}</p>}
 {connectionError && <button type="button" disabled={busy} onClick={() => { setError(""); refresh(); }}>Reconnect to account service</button>}
 {message && <p role="status">{message}</p>}
 <button className="account-submit" disabled={busy}>{busy ? 'Please wait…' : <>{profile ? 'Save profile' : register ? 'Create account' : 'Sign in'} <Icon name="arrow-up-right"/></>}</button>
 </form>
 {profile ? <><Link to="/#collection" className="account-link">Customize a car <Icon name="arrow-up-right"/></Link><button className="account-signout" disabled={busy || cartPending} onClick={async () => { setBusy(true); try { await act('logout','POST'); } catch(error) { setError(error.message); } finally { setBusy(false); } }}>Sign out</button></> : <p className="account-switch">{register ? 'Already a member?' : 'New here?'} <Link to={register ? '/sign-in' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>}
 </div></section>{profile && <SavedDesigns/>}<SiteFooter/></main>;
}

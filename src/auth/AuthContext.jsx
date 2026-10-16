import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
const Context = createContext(null);
export async function accountRequest(path, method = 'GET', data) {
 let response, result;
 try {
  response = await fetch(`/api/${path}`, { method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000), headers: data ? { 'Content-Type': 'application/json' } : {}, body: data ? JSON.stringify(data) : undefined });
  result = await response.json();
 } catch {
  throw Object.assign(new Error('The account service is temporarily unavailable. Reconnecting…'), { connection: true });
 }
 if (!response.ok) throw Object.assign(new Error(result.error || 'Unable to complete this request.'), { connection: response.status >= 500 });
 return result.user;
}
export function AuthProvider({ children }) {
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const revision = useRef(0);
 const submitting = useRef(false);
 const refresh = useCallback(async () => {
  if (submitting.current) return;
  const current = ++revision.current;
  try { const result = await accountRequest('me'); if (current === revision.current) { setUser(result); setError(''); } }
  catch (error) { if (current === revision.current) setError(error.message); }
  finally { if (current === revision.current) setLoading(false); }
 }, []);
 useEffect(() => { refresh(); return () => { revision.current++; }; }, [refresh]);
 useEffect(() => {
  if (!error) return;
  const timer = setInterval(refresh, 20000);
  window.addEventListener('online', refresh);
  return () => { clearInterval(timer); window.removeEventListener('online', refresh); };
 }, [error, refresh]);
 const act = async (path, method, data) => {
  submitting.current = true;
  const current = ++revision.current;
  try { const result = await accountRequest(path, method, data); if (current === revision.current) { setUser(result); setError(''); } return result; }
  catch (error) { if (error.connection) setError(error.message); throw error; }
  finally { submitting.current = false; }
 };
 return <Context.Provider value={{ user, loading, error, act, refresh }}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);

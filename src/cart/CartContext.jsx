import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { garageRequest } from '../auth/garageApi';
import { cartReducer, cleanCart, cartTotal } from './cart.js';
const CartContext = createContext(null);
const storageKey = 'limitless-cart-v1';
function readCart() { try { return cleanCart(JSON.parse(localStorage.getItem(storageKey))); } catch { return []; } }
export function CartProvider({ children }) {
 const { user, loading } = useAuth();
 return <ScopedCart key={loading ? 'loading' : user?.id || 'guest'} user={user} authLoading={loading}>{children}</ScopedCart>;
}
function ScopedCart({ children, user, authLoading }) {
 const [items, setItems] = useState(() => user || authLoading ? [] : readCart());
 const current = useRef(items);
 const [loading, setLoading] = useState(Boolean(user) || authLoading);
 const [pending, setPending] = useState(false);
 const [storageError, setStorageError] = useState('');
 const loadVersion = useRef(0);
 const busy = useRef(false); const mounted = useRef(true);
 const load = async () => {
  if (!user) return;
  const version = ++loadVersion.current;
  setLoading(true);
  try { const result = await garageRequest('cart'); if (mounted.current && version === loadVersion.current) { current.current = cleanCart(result.items); setItems(current.current); setStorageError(''); } }
  catch (error) { if (mounted.current && version === loadVersion.current) setStorageError(error.message); }
  finally { if (mounted.current && version === loadVersion.current) setLoading(false); }
 };
 useEffect(() => { mounted.current = true; load(); return () => { mounted.current = false; loadVersion.current++; }; }, []);
 const dispatch = async action => {
  if (busy.current || loading) return false;
  busy.current = true; setPending(true);
  try {
   let next;
   if (user) next = cleanCart((await garageRequest('cart','POST',action)).items);
   else { next = cartReducer(current.current,action); localStorage.setItem(storageKey,JSON.stringify(next)); }
   if (mounted.current) { current.current = next; setItems(next); setStorageError(''); }
   return true;
  } catch(error) { if (mounted.current) setStorageError(error.message || 'Unable to save your cart. Please try again.'); return false; }
  finally { busy.current = false; if (mounted.current) setPending(false); }
 };
 const importGuest = async () => { const saved=readCart(); if(saved.length && await dispatch({type:'import',items:saved})) {try {localStorage.removeItem(storageKey);}catch {} setItems([...current.current]);} };
 return <CartContext.Provider value={{items,dispatch,loading,pending,storageError,retry:load,importGuest,hasGuestCart:Boolean(user && readCart().length),count:items.reduce((sum,item)=>sum+item.quantity,0),total:cartTotal(items)}}>{children}</CartContext.Provider>;
}
export function useCart() { return useContext(CartContext); }

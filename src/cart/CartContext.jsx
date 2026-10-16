import { createContext, useContext, useRef, useState } from "react";
import { cartReducer, cleanCart, cartTotal } from "./cart.js";
const CartContext = createContext(null);
const storageKey = "limitless-cart-v1";
function readCart() { try { return cleanCart(JSON.parse(localStorage.getItem(storageKey))); } catch { return []; } }
export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  const currentItems = useRef(items);
  const [storageError, setStorageError] = useState(false);
  const dispatch = (action) => {
    const next = cartReducer(currentItems.current, action);
    currentItems.current = next;
    setItems(next);
    try {localStorage.setItem(storageKey, JSON.stringify(next)); setStorageError(false);} catch {setStorageError(true);}
  };
  return <CartContext.Provider value={{ items, dispatch, storageError, count: items.reduce((sum, item) => sum + item.quantity, 0), total: cartTotal(items) }}>{children}</CartContext.Provider>;
}
export function useCart() { return useContext(CartContext); }

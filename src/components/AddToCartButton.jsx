import { useState } from "react";
import { Link } from "react-router";
import { useCart } from "../cart/CartContext";
export default function AddToCartButton({ car, design = null }) {
  const { dispatch, items, pending, loading, storageError } = useCart();
  const [added, setAdded] = useState(false);
  return <div className="add-cart-control"><button type="button" className="shop-button" disabled={pending || loading} onClick={async () => { setAdded(await dispatch({type:"add", carId:car.id, design})); }}>Add {design ? "my design" : "to cart"} +</button>{storageError && <span role="alert">{storageError}</span>}{added && items.some(item => item.carId === car.id) && <span role="status">Added · <Link to="/cart">View cart ↗</Link></span>}</div>;
}

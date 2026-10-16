import { useState } from "react";
import { Link } from "react-router";
import { useCart } from "../cart/CartContext";
export default function AddToCartButton({ car, design = null }) {
  const { dispatch, items } = useCart();
  const [added, setAdded] = useState(false);
  return <div className="add-cart-control"><button type="button" className="shop-button" onClick={() => { dispatch({type:"add", carId:car.id, design}); setAdded(true); }}>Add {design ? "my design" : "to cart"} +</button>{added && items.some(item => item.carId === car.id) && <span role="status">Added · <Link to="/cart">View cart ↗</Link></span>}</div>;
}

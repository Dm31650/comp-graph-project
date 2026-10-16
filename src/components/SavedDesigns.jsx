import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { garageRequest } from '../auth/garageApi';
import { useCart } from '../cart/CartContext';
import { cars } from '../data/cars';
import { carModels } from '../data/carModels';
import CarViewer from './CarViewer';

export default function SavedDesigns({ onCountChange }) {
 const [designs,setDesigns] = useState([]); const [loading,setLoading] = useState(true); const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [selected,setSelected] = useState(null); const [notice,setNotice] = useState('');
 const {dispatch,pending,loading:cartLoading,count,hasGuestCart,importGuest,storageError} = useCart();
 const load = async () => { setLoading(true); try { setDesigns((await garageRequest('designs')).designs); setError(''); } catch(error) { setError(error.message); } finally {setLoading(false);} };
 useEffect(()=>{load();},[]);
 useEffect(()=>{onCountChange?.(loading || error ? null : designs.length);},[designs.length,loading,error,onCountChange]);
 useEffect(()=>{if(selected)document.getElementById('saved-design-preview')?.scrollIntoView({block:'center'});},[selected]);
 const remove = async id => { setBusy(true); try { setDesigns((await garageRequest('designs','DELETE',{id})).designs); if(selected?.id===id)setSelected(null); setError(''); } catch(error){setError(error.message);} finally {setBusy(false);} };
 const car = selected && cars.find(car=>car.id===selected.carId); const model = selected && carModels[selected.carId];
 return <section className="saved-garage" aria-labelledby="saved-title"><div className="garage-heading"><div><p className="eyebrow">YOUR SIGNATURE COLLECTION</p><h2 id="saved-title">Saved designs <span>{designs.length}</span></h2><p>Your designs and cart stay in your account after you sign out.</p></div><Link className="shop-button" to="/cart">View cart · {count} ↗</Link></div>
 {hasGuestCart && <button className="shop-button" disabled={pending||cartLoading} onClick={importGuest}>Move this browser’s guest cart into my account</button>}
 {storageError && <p role="alert">{storageError}</p>}
 {error && <p role="alert">{error} <button onClick={load}>Try again</button></p>}{notice && <p role="status">{notice}</p>}
 {loading ? <p role="status">Loading saved designs…</p> : !designs.length && !error ? <div className="garage-empty"><h3>Your next creation belongs here.</h3><p>Customize a car and choose “Save to my profile”.</p><Link to="/#collection">Explore cars ↗</Link></div> : <div className="saved-grid">{designs.map(item=>{const vehicle=cars.find(car=>car.id===item.carId); if(!vehicle)return null; return <article className="saved-card" key={item.id}><img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.name}`} loading="lazy"/><div><p className="eyebrow">{vehicle.brand} / {vehicle.name}</p><h3>{item.name}</h3><p><span className="cart-paint" style={{background:item.design.paint}}/>{item.design.finish} · {item.design.design}</p><small>Wheels {item.design.wheels} · {item.design.studio}</small><div className="saved-actions"><button onClick={()=>setSelected(item)} aria-pressed={selected?.id===item.id}>View in 3D</button><Link to={`/cars/${item.carId}#customize-car`} state={{savedDesign:item.design}}>Edit design</Link><button disabled={pending||cartLoading} onClick={async()=>{if(await dispatch({type:'add',carId:item.carId,design:item.design}))setNotice(`${item.name} added to your cart.`);}}>Add to cart</button><button disabled={busy} onClick={()=>remove(item.id)}>Delete</button></div></div></article>;})}</div>}
 {selected && model && <div id="saved-design-preview" className="saved-preview"><div className="garage-heading"><h3>{selected.name}</h3><button onClick={()=>setSelected(null)}>Close preview</button></div><div className="saved-viewer"><CarViewer key={selected.id} modelUrl={model.url} modelRotation={model.rotation||0} modelName={`${car.brand} ${car.name}`} customization={selected.design} studio={selected.design.studio}/></div></div>}
 </section>;
}

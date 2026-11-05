import { Link, useSearchParams } from 'react-router';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';
import Icon from '../components/Icon';
import { cars } from '../data/cars';
import { formatMoney } from '../cart/cart';
import { useVehicleSelection, updateSelection } from '../collection/selection';
import '../styles/CollectionTools.css';

export default function VehicleCompare(){
 const [params]=useSearchParams();const selection=useVehicleSelection();
 const requested=params.has('cars')?params.get('cars').split(',').map(Number):selection.compare;
 const vehicles=[...new Set(requested)].map(id=>cars.find(car=>car.id===id)).filter(Boolean).slice(0,3);
 const fields=[['Demonstration price',c=>formatMoney(c.price)],['Power',c=>`${c.horsepower} HP`],['0–100 km/h',c=>c.acceleration],['Powertrain',c=>c.fuel],['Transmission',c=>c.transmission],['Model year',c=>c.year]];
 return <main className="shop-page"><SiteHeader/><div className="shop-container"><div className="shop-intro"><p className="eyebrow">YOUR NEXT OBSESSION / SIDE BY SIDE</p><h1>THE FINER <span>DIFFERENCES.</span></h1><p>Compare up to three vehicles, then bring your favorite into the studio.</p></div>{vehicles.length?<><div className="vehicle-comparison-scroll"><table className="vehicle-comparison" style={{minWidth:160+vehicles.length*250}}><caption>Vehicle specifications and demonstration prices</caption><thead><tr><th scope="col">The collection</th>{vehicles.map(car=><th scope="col" key={car.id}><img src={car.image} alt={`${car.brand} ${car.name}`}/><small>{car.brand}</small><h2>{car.name}</h2><Link to={`/cars/${car.id}`}>Explore vehicle <Icon name="arrow-up-right"/></Link></th>)}</tr></thead><tbody>{fields.map(([label,get])=><tr key={label}><th scope="row">{label}</th>{vehicles.map(car=><td key={car.id}>{get(car)}</td>)}</tr>)}<tr><th scope="row">Make it yours</th>{vehicles.map(car=><td key={car.id}><Link className="shop-button" to={`/cars/${car.id}#customize-car`}>Customize <Icon name="arrow-up-right"/></Link><Link className="compare-drive-link" to={`/test-drive/${car.id}`}>Test drive</Link></td>)}</tr></tbody></table></div><p className="collection-storage-note">Prices are for the educational demo. Source 3D models may differ in trim details; see each vehicle’s model notes.</p></>:<div className="shop-empty"><h2>Choose your contenders.</h2><p>Select Compare on the collection cards to add up to three vehicles.</p></div>}<div className="compare-page-actions"><Link to="/#collection" className="shop-button"><Icon name="arrow-left"/> Back to collection</Link>{selection.compare.length>0&&<button onClick={()=>updateSelection('clearCompare')}>Clear comparison selection</button>}</div></div><SiteFooter/></main>;
}

import { useVehicleSelection, updateSelection } from '../collection/selection';
import '../styles/CollectionTools.css';
import Icon from './Icon';
import AddToCartButton from "./AddToCartButton";

import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { cars } from "../data/cars";

const brands = ["All", ...new Set(cars.map(car=>car.brand))];

const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);

/* CAR CARD */
function CarCard({ car }) {
  const selection=useVehicleSelection(); const favorite=selection.favorites.includes(car.id),compared=selection.compare.includes(car.id);
  return (
    <article className="collection-card">
      <div className="collection-card-image"><div className="collection-card-tools"><button type="button" aria-label={`${favorite?"Remove":"Add"} ${car.brand} ${car.name} ${favorite?"from":"to"} shortlist`} title={favorite?"Remove from shortlist":"Save to shortlist"} aria-pressed={favorite} onClick={()=>updateSelection("favorites",car.id)}><Icon name="heart"/></button></div>
        {car.image ? (
          <Link to={`/cars/${car.id}`}><img
            src={car.image}
            alt={`${car.brand} ${car.name}`}
            loading="lazy"
          /></Link>
        ) : (
          <div className="car-placeholder">
            <span className="placeholder-brand">
              {car.brand.toUpperCase()}
            </span>

            <span
              className="placeholder-car"
              aria-hidden="true"
            >
              <Icon name="car"/>
            </span>

            <span className="placeholder-model">
              {car.name.toUpperCase()}
            </span>
          </div>
        )}

        {(car.featured || car.newArrival) && (
          <span className="featured-tag">
            {car.newArrival ? "NEW / SUPERCAR COLLECTION" : "FEATURED"}
          </span>
        )}
      </div>

      <div className="collection-card-content">
        <div className="card-topline">
          <span>{car.brand}</span>
          <span>{car.year}</span>
        </div>

        <h3>{car.name}</h3>

        <div className="card-specifications">
          <span>{car.horsepower} HP</span>

          <span>
            0–100: {car.acceleration}
          </span>

          <span>{car.fuel}</span>
        </div>

        <div className="card-bottom">
          <div>
            <span className="price-label">
              DEMO PRICE
            </span>

            <strong>
              {formatPrice(car.price)}
            </strong>
          </div>

          <Link
            className="details-button"
            to={`/cars/${car.id}`}
          >
            DETAILS <Icon name="arrow-up-right"/>
          </Link>
        </div>
      </div>
      <AddToCartButton car={car} /><div className="collection-card-compare"><button type="button" aria-pressed={compared} disabled={!compared&&selection.compare.length>=3} onClick={()=>updateSelection("compare",car.id)}><Icon name={compared?"check":"compare"}/>{compared?"Selected":"Compare"}</button><Link to={`/test-drive/${car.id}`}>Test drive <Icon name="arrow-up-right"/></Link></div>
    </article>
  );
}

/* COLLECTION */
function CarCollection() {
  const selection=useVehicleSelection(); const [favoritesOnly,setFavoritesOnly]=useState(false); const [fuel,setFuel]=useState("All powertrains");
  const [params,setParams] = useSearchParams();
  const selectedBrand = brands.includes(params.get("brand")) ? params.get("brand") : "All"; const setSelectedBrand = brand => { const next=new URLSearchParams(params); if(brand==="All")next.delete("brand");else next.set("brand",brand);setParams(next,{replace:true,preventScrollReset:true}); };

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");

  const filteredCars = useMemo(() => {
    const result = cars.filter((car) => {
      const matchesBrand =
        selectedBrand === "All" ||
        car.brand === selectedBrand;

      const searchText =
        `${car.brand} ${car.name}`.toLowerCase();

      const matchesSearch = searchText.includes(
        search.trim().toLowerCase()
      );

      return matchesBrand && matchesSearch && (!favoritesOnly||selection.favorites.includes(car.id)) && (fuel==="All powertrains"||car.fuel===fuel);
    });

    if (sort === "low") {
      result.sort(
        (a, b) => a.price - b.price
      );
    }

    if (sort === "high") {
      result.sort(
        (a, b) => b.price - a.price
      );
    }

    if (sort === "power") {
      result.sort(
        (a, b) => b.horsepower - a.horsepower
      );
    }

    return result;
  }, [selectedBrand, search, sort, favoritesOnly, selection.favorites, fuel]);

  return (
    <section
      className="collection-section"
      id="collection"
    >
      {/* SECTION HEADER */}
      <div className="collection-heading">
        <div>
          <p className="eyebrow">
            THE LIMITLESS COLLECTION
          </p>

          <h2>
            EXPLORE OUR <span>GARAGE.</span>
          </h2>

          <p className="collection-description">
            Discover a selection of extraordinary
            performance and luxury vehicles.
          </p>
        </div>

        <span className="inventory-count">
          {filteredCars.length} VEHICLES
        </span>
      </div>

      {/* FILTERS */}
      <div className="collection-toolbar">
        <div className="brand-filters">
          {brands.map((brand) => (
            <button
              key={brand}
              type="button"
              className={
                selectedBrand === brand
                  ? "brand-filter active"
                  : "brand-filter"
              }
              onClick={() =>
                setSelectedBrand(brand)
              }
            >
              {brand}
            </button>
          ))}
        </div>

        {/* SEARCH AND SORT */}
        <div className="collection-controls">
          <input
            type="search"
            placeholder="Search cars..."
            aria-label="Search cars"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
            aria-label="Sort vehicles"
          >
            <option value="default">
              Featured order
            </option>

            <option value="low">
              Price: Low to High
            </option>

            <option value="high">
              Price: High to Low
            </option>

            <option value="power">
              Most Powerful
            </option>
          </select>
        </div>
      </div>

      <div className="collection-secondary-filters"><label>Powertrain<select value={fuel} onChange={e=>setFuel(e.target.value)}>{['All powertrains','Petrol','Hybrid','Electric'].map(item=><option key={item}>{item}</option>)}</select></label><label><input type="checkbox" checked={favoritesOnly} onChange={e=>setFavoritesOnly(e.target.checked)}/> Shortlist only ({selection.favorites.length})</label><span>Shortlist saved on this device</span></div>
      {/* VEHICLE GRID */}
      {filteredCars.length > 0 ? (
        <div className="collection-grid">
          {filteredCars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
            />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <h3>No vehicles found.</h3>

          <p>
            Try another brand or search term.
          </p>

          <button
            type="button"
            onClick={() => {
              setSelectedBrand("All");
              setSearch("");
              setSort("default");setFavoritesOnly(false);setFuel("All powertrains");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {selection.compare.length>0&&<aside className="compare-tray" aria-label="Vehicle comparison selection"><div><strong>{selection.compare.length} / 3 vehicles selected</strong><small>{selection.compare.map(id=>cars.find(c=>c.id===id)?.name).join(' / ')}</small></div><Link to={`/compare?cars=${selection.compare.join(',')}`}>Compare <Icon name="arrow-right"/></Link><button onClick={()=>updateSelection('clearCompare')}>Clear</button></aside>}
    </section>
  );
}

export default CarCollection;

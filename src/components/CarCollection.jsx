
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { cars } from "../data/cars";

const brands = [
  "All",
  "Porsche",
  "BMW",
  "Mercedes-Benz",
  "Audi",
];

const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);

/* CAR CARD */
function CarCard({ car }) {
  return (
    <article className="collection-card">
      <div className="collection-card-image">
        {car.image ? (
          <img
            src={car.image}
            alt={`${car.brand} ${car.name}`}
            loading="lazy"
          />
        ) : (
          <div className="car-placeholder">
            <span className="placeholder-brand">
              {car.brand.toUpperCase()}
            </span>

            <span
              className="placeholder-car"
              aria-hidden="true"
            >
              🚘
            </span>

            <span className="placeholder-model">
              {car.name.toUpperCase()}
            </span>
          </div>
        )}

        {car.featured && (
          <span className="featured-tag">
            FEATURED
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
            DETAILS ↗
          </Link>
        </div>
      </div>
    </article>
  );
}

/* COLLECTION */
function CarCollection() {
  const [selectedBrand, setSelectedBrand] =
    useState("All");

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

      return matchesBrand && matchesSearch;
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
  }, [selectedBrand, search, sort]);

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
              setSort("default");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}

export default CarCollection;

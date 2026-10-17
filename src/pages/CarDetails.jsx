import Icon from '../components/Icon';
import AddToCartButton from "../components/AddToCartButton";
import { SiteHeader, SiteFooter } from "../components/SiteChrome";

import { useEffect } from "react";
import { Link, useParams } from "react-router";

import { carModels } from "../data/carModels";
import { cars } from "../data/cars";
import CarViewer from "../components/CarViewer";
import CarCustomizer from "../components/CarCustomizer";

import "./CarDetails.css";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);

function CarDetails() {
  const { id } = useParams();

  const car = cars.find(
    (item) => item.id === Number(id)
  );

  useEffect(() => {
    window.scrollTo(0, 0);

    document.title = car
      ? `${car.brand} ${car.name} | Limitless-Deal Hub`
      : "Vehicle Not Found | Limitless-Deal Hub";

    return () => {
      document.title = "Limitless-Deal Hub";
    };
  }, [car]);

  if (!car) {
    return (
      <main className="details-page">
        <div className="vehicle-not-found">
          <p className="eyebrow">
            VEHICLE NOT FOUND
          </p>

          <h1>404</h1>

          <p>
            This vehicle does not exist in
            our collection.
          </p>

          <Link to="/#collection">
            <Icon name="arrow-left"/> BACK TO COLLECTION
          </Link>
        </div>
      </main>
    );
  }

  const model = carModels[car.id];
  const has3DModel = Boolean(model);

  return (
    <main className="details-page">
      {/* HEADER */}
      <SiteHeader />

      <div className="vehicle-container">
        {/* PAGE INTRO */}
        <div className="vehicle-intro">
          <div>
            <p className="eyebrow">
              THE LIMITLESS COLLECTION / {car.year}
            </p>

            <h1>
              <span>{car.brand}</span>
              {car.name}
            </h1>

            <p className="vehicle-intro-description">
              {car.description}
            </p>
          </div>

          <div className="vehicle-price">
            <span>DEMONSTRATION PRICE</span>
            <strong>
              {formatPrice(car.price)}
            </strong>
            <a href="#customize-car" className="vehicle-collection-button customize-entry">Customize your Car <Icon name="arrow-up-right"/></a>
            <AddToCartButton car={car} />
          </div>
        </div>

        {/* 3D ASSEMBLY SHOWROOM */}
        {has3DModel && (
          <section className="vehicle-3d-section">
            <div className="vehicle-3d-heading">
              <p className="eyebrow">
                IMMERSIVE EXPERIENCE
              </p>

              <h2>
                EXPLORE IN <span>3D.</span>
              </h2>

              <p>
                Drag with your mouse to inspect
                the {car.brand} {car.name} from different angles.
              </p>
            </div>

            <div className="vehicle-3d-viewer">
              <CarViewer key={model.url} modelUrl={model.url} modelRotation={model.rotation || 0} modelName={`${car.brand} ${car.name}`} />
            </div>

            <div className="model-credit">
              {model.note && <p>{model.note}</p>}
              <p>3D model: <a href={model.source} target="_blank" rel="noreferrer">{model.title}</a> by {model.author}. {model.license}. Adapted for assembly animation and normalized for display.{car.id === 3 ? " Geometry and textures reduced for web display." : ""}</p>
            </div>
            <div className="viewer-hint">
              <span>DRAG TO ROTATE</span>
              <span>INTERACTIVE 3D EXPERIENCE</span>
            </div>
          </section>
        )}

        {/* VEHICLE PHOTO */}
        {!has3DModel && <div className="vehicle-main-image">
          {car.image ? (
            <img
              src={car.image}
              alt={`${car.brand} ${car.name}`}
            />
          ) : (
            <div className="vehicle-image-placeholder">
              <span aria-hidden="true"><Icon name="car"/></span>
              <h2>
                {car.brand} {car.name}
              </h2>
            </div>
          )}

          <span className="vehicle-image-label">
            {car.brand.toUpperCase()} / {car.year}
          </span>
        </div>}

        <CarCustomizer key={car.id} car={car} />

        {/* PERFORMANCE */}
        <section className="vehicle-performance">
          <div className="performance-heading">
            <p className="eyebrow">
              ENGINEERED FOR PERFORMANCE
            </p>

            <h2>
              PERFORMANCE <span>DETAILS.</span>
            </h2>
          </div>

          <div className="performance-grid">
            <div className="performance-item">
              <span>MAXIMUM POWER</span>
              <strong>
                {car.horsepower}
                <small> HP</small>
              </strong>
            </div>

            <div className="performance-item">
              <span>0–100 KM/H</span>
              <strong>
                {car.acceleration}
              </strong>
            </div>

            <div className="performance-item">
              <span>MODEL YEAR</span>
              <strong>{car.year}</strong>
            </div>
          </div>
        </section>

        {/* SPECIFICATIONS */}
        <section className="vehicle-specifications">
          <div className="specification-title">
            <p className="eyebrow">
              EVERY DETAIL MATTERS
            </p>

            <h2>
              VEHICLE SPECIFICATIONS
            </h2>

            <p>
              Explore the main specifications
              of this vehicle.
            </p>
          </div>

          <div className="specification-table">
            <div>
              <span>Manufacturer</span>
              <strong>{car.brand}</strong>
            </div>

            <div>
              <span>Model</span>
              <strong>{car.name}</strong>
            </div>

            <div>
              <span>Year</span>
              <strong>{car.year}</strong>
            </div>

            <div>
              <span>Horsepower</span>
              <strong>
                {car.horsepower} HP
              </strong>
            </div>

            <div>
              <span>Transmission</span>
              <strong>{car.transmission}</strong>
            </div>

            <div>
              <span>Fuel Type</span>
              <strong>{car.fuel}</strong>
            </div>

            <div>
              <span>Exterior Color</span>
              <strong>{car.color}</strong>
            </div>

            <div>
              <span>0–100 KM/H</span>
              <strong>{car.acceleration}</strong>
            </div>
          </div>
        </section>

        {/* BOTTOM */}
        <div className="vehicle-bottom">
          <div>
            <p className="eyebrow">
              DISCOVER MORE
            </p>

            <h2>
              YOUR NEXT CAR AWAITS.
            </h2>
          </div>

          <Link
            to="/#collection"
            className="vehicle-collection-button"
          >
            EXPLORE MORE VEHICLES <Icon name="arrow-up-right"/>
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}

export default CarDetails;

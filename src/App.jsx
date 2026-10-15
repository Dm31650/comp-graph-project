
import { useEffect, useRef } from "react";
import { Routes, Route, Link } from "react-router";
import { gsap } from "gsap";

import CarViewer from "./components/CarViewer";
import CarCollection from "./components/CarCollection";
import CarDetails from "./pages/CarDetails";

import "./App.css";

function Home() {
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-heading > *",
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
          delay: 0.2,
        }
      );

      gsap.fromTo(
        ".hero-bottom",
        {
          opacity: 0,
          y: 25,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          delay: 1.2,
        }
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <main className="website" ref={pageRef}>
      {/* NAVIGATION */}
      <header className="navbar">
        <Link to="/" className="logo">
          Limitless-Deal Hub<span>.</span>
        </Link>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#collection">Collection</a>
          <a href="#about">About</a>
        </nav>

        <a href="#collection" className="nav-button">
          Explore Cars ↗
        </a>
      </header>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-heading">
          <p className="eyebrow">
            THE ART OF PERFORMANCE
          </p>

          <h1>
            FIND YOUR
            <br />
            <span>DREAM CAR.</span>
          </h1>

          <p className="hero-description">
            Discover extraordinary performance,
            timeless design, and the thrill of driving.
          </p>
        </div>

        {/* 3D PORSCHE */}
        <div className="hero-car">
          <CarViewer />
        </div>

        {/* SCROLL INDICATOR */}
        <div className="scroll-indicator">
          <span>SCROLL TO EXPLORE</span>
          <div className="scroll-line"></div>
        </div>

        {/* HERO BOTTOM */}
        <div className="hero-bottom">
          <a
            href="#collection"
            className="explore-button"
          >
            EXPLORE COLLECTION <span>↗</span>
          </a>

          <div className="car-info">
            <span>01 / FEATURED MODEL</span>
            <strong>PORSCHE 911 GT3 RS</strong>
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <div className="brands">
        <span>PORSCHE</span>
        <span>BMW</span>
        <span>MERCEDES-BENZ</span>
        <span>AUDI</span>
      </div>

      {/* CAR COLLECTION */}
      <CarCollection />

      {/* ABOUT */}
      <section className="about-section" id="about">
        <p className="eyebrow">
          BEYOND THE ORDINARY
        </p>

        <h2>DRIVEN BY EXCELLENCE.</h2>

        <p>
          Explore a curated collection of exceptional
          automobiles, brought to life through immersive
          3D experiences.
        </p>
      </section>
    </main>
  );
}

/* ALL WEBSITE ROUTES */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/cars/:id"
        element={<CarDetails />}
      />

      <Route
        path="*"
        element={
          <main
            className="website"
            style={{
              minHeight: "100vh",
              display: "grid",
              placeContent: "center",
              textAlign: "center",
              gap: "20px",
              padding: "30px",
            }}
          >
            <h1>404 | Page Not Found</h1>

            <Link to="/" className="nav-button">
              Return Home ↗
            </Link>
          </main>
        }
      />
    </Routes>
  );
}

export default App;

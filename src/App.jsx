import Icon from './components/Icon';
import Experience from './pages/Experience';
import Account from "./pages/Account";
import { AuthProvider } from "./auth/AuthContext";
import { SiteHeader, SiteFooter, ExperienceBand, ShowroomFAQ } from "./components/SiteChrome";

import { useEffect, useRef } from "react";
import { Routes, Route, Link } from "react-router";
import { gsap } from "gsap";

import CarViewer from "./components/CarViewer";
import CarCollection from "./components/CarCollection";
import CarDetails from "./pages/CarDetails";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Contact from "./pages/Contact";
import { CartProvider } from "./cart/CartContext";
import "./pages/Shop.css";

import "./App.css";
import InteractiveBackground from "./components/InteractiveBackground";

function Home() {
  const pageRef = useRef(null);

  useEffect(() => {
    if (window.location.hash === "#collection") document.getElementById("collection")?.scrollIntoView();
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
      <SiteHeader />

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
            EXPLORE COLLECTION <span><Icon name="arrow-up-right"/></span>
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

      <ExperienceBand />

      {/* CAR COLLECTION */}
      <CarCollection />

      <ShowroomFAQ />
      <SiteFooter />
    </main>
  );
}

/* ALL WEBSITE ROUTES */
function App() {
  return (
    <AuthProvider><CartProvider><div className="site-experience"><InteractiveBackground /><div className="site-content"><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sign-in" element={<Account key="login" />} />
      <Route path="/register" element={<Account key="register" mode="register" />} />
      <Route path="/profile" element={<Account key="profile" mode="profile" />} />
      <Route path="/experience" element={<Experience/>} />
      <Route path="/about" element={<About />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/contact" element={<Contact />} />

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
              Return Home <Icon name="arrow-up-right"/>
            </Link>
          </main>
        }
      />
    </Routes></div></div></CartProvider></AuthProvider>
  );
}

export default App;


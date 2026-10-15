import { Link, useLocation } from "react-router";
import { cars } from "../data/cars";
import "./SiteChrome.css";

export function SiteHeader() {
  const { pathname } = useLocation();
  return <header className="site-header">
    <Link to="/" className="logo" aria-label="Limitless-Deal Hub home">Limitless-Deal Hub<span>.</span></Link>
    <nav aria-label="Main navigation">
      <Link to="/" aria-current={pathname === "/" ? "page" : undefined}>Home</Link>
      <Link to="/#collection" onClick={() => document.getElementById("collection")?.scrollIntoView()}>Collection</Link>
      <Link to="/about" aria-current={pathname === "/about" ? "page" : undefined}>About Us</Link>
    </nav>
    <Link className="site-header-cta" to="/cars/1">ENTER THE SHOWROOM <span aria-hidden="true">↗</span></Link>
  </header>;
}

export function ExperienceBand() {
  return <section className="experience-band" aria-label="Explore the showroom">
    <div><span className="experience-index">01 / ASSEMBLE</span><h2>Every piece. One vision.</h2><p>Watch each car come together in an animated 3D reveal.</p></div>
    <div><span className="experience-index">02 / INTERACT</span><h2>A new angle on everything.</h2><p>Drag to rotate and explore the details at your own pace.</p></div>
    <div><span className="experience-index">03 / DISCOVER</span><h2>Find what moves you.</h2><p>Explore six cars, four marques, and their individual character.</p></div>
  </section>;
}

export function ShowroomFAQ() {
  return <section className="showroom-faq" aria-labelledby="faq-title">
    <div><p className="eyebrow">GOOD TO KNOW</p><h2 id="faq-title">A LITTLE<br />MORE INSIGHT.</h2><Link to="/about">The story behind the showroom ↗</Link></div>
    <div className="faq-items">
      <details><summary>How do I explore a car in 3D?</summary><p>Open any car’s detail page and let the assembly animation finish. Then drag across the car to rotate it. Use Replay to see it come together again, or Skip intro to start exploring immediately.</p></details>
      <details><summary>Can I buy a car here?</summary><p>This is a computer graphics project and digital showroom. The collection and prices are for demonstration; no purchases or reservations are taken.</p></details>
      <details><summary>Why might a 3D car look different from its photo?</summary><p>The showroom uses credited third-party models. Some represent a different year, trim, or colour. Each detail page explains any known differences and links to its model creator.</p></details>
      <details><summary>Can I turn off the animation?</summary><p>Use Skip intro in the car viewer or Pause motion on the About page’s logo. The site also respects your device’s reduced-motion preference for these experiences.</p></details>
    </div>
  </section>;
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-invite"><div><p className="eyebrow">THE NEXT GREAT VIEW IS YOURS.</p><h2>STAY CURIOUS.<br /><span>DRIVE LIMITLESS.</span></h2></div><Link to="/#collection" onClick={() => document.getElementById("collection")?.scrollIntoView()}>EXPLORE THE COLLECTION <span aria-hidden="true">↗</span></Link></div>
    <div className="footer-columns">
      <div className="footer-brand"><Link to="/" className="logo">Limitless-Deal Hub<span>.</span></Link><p>A digital garage for extraordinary design.<br />Built from curiosity. Driven by detail.</p><span className="footer-project">INTERACTIVE STUDENT SHOWROOM</span></div>
      <nav aria-label="Footer navigation"><h3>TAKE A LOOK</h3><Link to="/">Home</Link><Link to="/#collection" onClick={() => document.getElementById("collection")?.scrollIntoView()}>The collection</Link><Link to="/about">Our story</Link><a href="/models/MODEL-CREDITS.md" target="_blank" rel="noreferrer">3D model credits ↗</a></nav>
      <nav aria-label="Explore individual cars"><h3>THE GARAGE</h3>{cars.map(car => <Link key={car.id} to={`/cars/${car.id}`}>{car.brand} {car.name}</Link>)}</nav>
      <div className="footer-note"><h3>MADE TO EXPLORE</h3><p>Real-time 3D.<br />A different perspective.<br />An obsession with the details.</p><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>BACK TO TOP ↑</button></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Limitless-Deal Hub</span><span>Educational concept · Demonstration prices · No sales</span><span>DESIGNED TO BE DISCOVERED ↗</span></div>
  </footer>;
}

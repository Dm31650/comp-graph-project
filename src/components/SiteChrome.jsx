import Icon from './Icon';
import { useAuth } from "../auth/AuthContext";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../cart/CartContext";
import { Link, useLocation } from "react-router";
import { cars } from "../data/cars";
import "./SiteChrome.css";

export function SiteHeader() {
  const { pathname, hash, key: locationKey } = useLocation();
  const [menuOpen,setMenuOpen]=useState(false);
  const menuButton=useRef(null);
  useEffect(()=>{setMenuOpen(false);},[locationKey]);
  const { count } = useCart();
  const { user } = useAuth();
  const headerRef = useRef(null);
  const spacerRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1000px)');
    const closeOnDesktop = () => { if (!media.matches) setMenuOpen(false); };
    media.addEventListener('change', closeOnDesktop);
    return () => media.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    // Keep the rest of the page out of keyboard and screen-reader navigation.
    const blocked = [];
    let branch = headerRef.current;
    while (branch?.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          blocked.push([sibling, sibling.inert]); sibling.inert = true;
        }
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    menuButton.current?.focus();
    const keydown = event => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
      if (event.key !== 'Tab') return;
      const links = [...headerRef.current.querySelectorAll('a[href], button')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
      const first = links[0], last = links.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      blocked.forEach(([element, previous]) => { element.inert = previous; });
      document.removeEventListener('keydown', keydown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const header = headerRef.current;
    const spacer = spacerRef.current;
    let anchor = Math.max(0, window.scrollY);
    let frame = 0;
    const measure = () => { spacer.style.height = `${header.offsetHeight}px`; };
    const reveal = () => header.classList.remove("site-header--hidden");
    const update = () => {
      frame = 0;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const current = Math.max(0, Math.min(window.scrollY, maxScroll));
      if (menuOpen || current <= header.offsetHeight || header.contains(document.activeElement)) {
        reveal();
        anchor = current;
        return;
      }
      if (Math.abs(current - anchor) < 8) return;
      header.classList.toggle("site-header--hidden", current > anchor);
      anchor = current;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    reveal();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname, menuOpen]);

  return <div ref={spacerRef} className="site-header-space"><header ref={headerRef} className={`site-header${menuOpen ? " menu-is-open" : ""}`} onFocusCapture={() => headerRef.current?.classList.remove("site-header--hidden")}>
    <Link to="/" className="logo" aria-label="Limitless-Deal Hub home">Limitless-Deal Hub<span>.</span></Link>
    <button ref={menuButton} type="button" className="mobile-menu-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={()=>setMenuOpen(!menuOpen)}><span/><span/><span/></button>
    <nav id="main-navigation" className={menuOpen ? "navigation-open" : ""} aria-label="Main navigation" onClick={event=>{if(event.target.closest("a")){setMenuOpen(false);menuButton.current?.focus();}}}>
      <div className="menu-eyebrow" aria-hidden="true">LIMITLESS / EXPLORE</div>
      <Link to="/" aria-current={pathname === "/" && !hash ? "page" : undefined}>Home</Link>
      <Link to="/#collection" aria-current={pathname === "/" && hash === "#collection" ? "page" : undefined} onClick={() => document.getElementById("collection")?.scrollIntoView()}>Collection</Link>
      <Link to="/experience" aria-current={pathname === "/experience" ? "page" : undefined}>Experience</Link>
      <Link to="/about" aria-current={pathname === "/about" ? "page" : undefined}>About Us</Link>
      <Link to="/contact" aria-current={pathname === "/contact" ? "page" : undefined}>Contact Us</Link>
      <div className="menu-signature" aria-hidden="true"><span>DRIVEN BY CURIOSITY.</span><span>BUILT TO EXPLORE <Icon name="arrow-up-right"/></span></div>
    </nav>


    <div className="header-actions"><Link className="header-icon" to="/cart" aria-label={`Cart, ${count} items`} title="Your cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h2l2.2 12h11l2-8H6M9 20h.01M18 20h.01"/></svg><span className="header-badge">{count}</span></Link><Link className="header-icon profile-icon" to={user ? '/profile' : '/sign-in'} aria-label={user ? 'My profile and saved designs' : 'Sign in'} title={user ? user.name : 'Sign in'}>{user?.avatar ? <img className="header-avatar" src={user.avatar} alt=""/> : <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></svg>}{user && <span className="profile-online"/>}</Link></div>
  </header></div>;
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
    <div><p className="eyebrow">GOOD TO KNOW</p><h2 id="faq-title">A LITTLE<br />MORE INSIGHT.</h2><Link to="/about">The story behind the showroom <Icon name="arrow-up-right"/></Link></div>
    <div className="faq-items">
      <details><summary>How do I explore a car in 3D?</summary><p>Open any car’s detail page and let the assembly animation finish. Then drag across the car to rotate it. Use Replay to see it come together again, or Skip intro to start exploring immediately.</p></details>
      <details><summary>Can I buy a car here?</summary><p>This is a computer graphics project and digital showroom. The collection and prices are for demonstration; you can build a cart and complete a demo checkout. No payments, purchases or reservations are taken.</p></details>
      <details><summary>Why might a 3D car look different from its photo?</summary><p>The showroom uses credited third-party models. Some represent a different year, trim, or colour. Each detail page explains any known differences and links to its model creator.</p></details>
      <details><summary>Can I turn off the animation?</summary><p>Use Skip intro in the car viewer or Pause motion on the About page’s logo. The site also respects your device’s reduced-motion preference for these experiences.</p></details>
    </div>
  </section>;
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-invite"><div><p className="eyebrow">THE NEXT GREAT VIEW IS YOURS.</p><h2>STAY CURIOUS.<br /><span>DRIVE LIMITLESS.</span></h2></div><Link to="/#collection" onClick={() => document.getElementById("collection")?.scrollIntoView()}>EXPLORE THE COLLECTION <span aria-hidden="true"><Icon name="arrow-up-right"/></span></Link></div>
    <div className="footer-columns">
      <div className="footer-brand"><Link to="/" className="logo">Limitless-Deal Hub<span>.</span></Link><p>A digital garage for extraordinary design.<br />Built from curiosity. Driven by detail.</p><span className="footer-project">INTERACTIVE STUDENT SHOWROOM</span></div>
      <nav aria-label="Footer navigation"><h3>TAKE A LOOK</h3><Link to="/">Home</Link><Link to="/#collection" onClick={() => document.getElementById("collection")?.scrollIntoView()}>The collection</Link><Link to="/about">Our story</Link><Link to="/contact">Contact Us</Link><Link to="/cart">Shopping cart</Link><a href="/models/MODEL-CREDITS.md" target="_blank" rel="noreferrer">3D model credits <Icon name="arrow-up-right"/></a></nav>
      <nav aria-label="Explore individual cars"><h3>THE GARAGE</h3>{cars.map(car => <Link key={car.id} to={`/cars/${car.id}`}>{car.brand} {car.name}</Link>)}</nav>
      <div className="footer-note"><h3>MADE TO EXPLORE</h3><p>Real-time 3D.<br />A different perspective.<br />An obsession with the details.</p><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>BACK TO TOP <Icon name="arrow-up"/></button></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Limitless-Deal Hub</span><span>Educational concept · Demonstration prices · No sales</span><span>DESIGNED TO BE DISCOVERED <Icon name="arrow-up-right"/></span></div>
  </footer>;
}

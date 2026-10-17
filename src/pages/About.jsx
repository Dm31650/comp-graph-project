import Icon from '../components/Icon';
import { SiteHeader, SiteFooter } from "../components/SiteChrome";
import { useEffect } from "react";
import { Link } from "react-router";
import "./About.css";
import BrandSculpture from "../components/BrandSculpture";

const principles = [
  ["01", "Design you can feel.", "A silhouette. A stance. A perfectly placed curve. We celebrate the details that make a car memorable before the engine even starts."],
  ["02", "Performance with character.", "Numbers tell part of the story. The rest lives in the engineering, the proportions, and the personality of every machine in our collection."],
  ["03", "Discovery in your hands.", "Watch the pieces come together. Turn the car around. Get curious about what’s underneath. Exploring should feel as exciting as finding your favourite."],
];

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Our Story | Limitless-Deal Hub";
    return () => { document.title = "Limitless-Deal Hub"; };
  }, []);

  return (
    <main className="about-page">
      <SiteHeader />

      <section className="story-hero" aria-labelledby="story-title">
        <div className="story-topline"><p className="eyebrow">OUR STORY / LIMITLESS BY DESIGN</p><span>EST. AS A CREATIVE EXPERIMENT</span></div>
        <h1 id="story-title">MORE THAN<br />A <em>PRETTY</em><br /><span>MACHINE.</span></h1>
        <div className="story-hero-bottom"><span className="story-arrow" aria-hidden="true"><Icon name="arrow-down-right"/></span><p>For the ones who see more than four wheels.<br />We bring automotive passion into a new dimension.</p><a href="#our-story">MEET LIMITLESS <span aria-hidden="true"><Icon name="arrow-down"/></span></a></div>
        <div className="story-speedlines" aria-hidden="true"><i /><i /><i /></div>
      </section>

      <BrandSculpture />

      <section className="story-manifesto" id="our-story">
        <div><p className="eyebrow">01 / WHY WE EXIST</p><h2>THE GARAGE<br />STARTED WITH<br /><em>A QUESTION.</em></h2></div>
        <div className="story-copy"><p className="story-lead">What if discovering a car felt less like scrolling a catalogue—and more like stepping inside its design?</p><p>Limitless-Deal Hub began as a computer graphics project with a love for remarkable cars. We wanted to turn a familiar shopping interface into something you could explore, move, and experience.</p><p>That idea became a digital garage. Here, a car arrives piece by piece, revealing the form behind the finished machine. You can look around it, compare its specifications, and discover what catches your eye.</p><p className="story-signature">Built from curiosity. Driven by detail.</p></div>
      </section>

      <section className="story-principles" aria-labelledby="principles-title">
        <div className="story-section-heading"><p className="eyebrow">02 / WHAT DRIVES US</p><h2 id="principles-title">THE DETAILS<br />MAKE THE DIFFERENCE.</h2></div>
        <div className="story-principle-grid">{principles.map(([number, title, copy]) => <article key={number}><span className="story-number">{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="story-process" aria-labelledby="process-title">
        <div className="story-section-heading"><p className="eyebrow">03 / A DIFFERENT WAY TO EXPLORE</p><h2 id="process-title">FROM PARTS.<br />TO POSSIBILITY.</h2></div>
        <div className="story-steps">
          <article><span>01 / DISCOVER</span><h3>Find your spark.</h3><p>Browse the collection and follow the design that speaks to you.</p></article>
          <article><span>02 / ASSEMBLE</span><h3>Watch it take shape.</h3><p>Open a car’s detail page and see its pieces come together in 3D.</p></article>
          <article><span>03 / EXPLORE</span><h3>Make it your viewpoint.</h3><p>Drag to rotate, replay the assembly, and get to know the specifications.</p></article>
        </div>
        <div className="story-project-note"><span>THE PROJECT</span><p>This is an educational digital showroom, not a live dealership. Prices are demonstrations. Third-party 3D models are credited on each vehicle page, where we also note differences in model year and trim.</p></div>
      </section>

      <section className="story-cta"><p className="eyebrow">YOUR CURIOSITY. OUR COLLECTION.</p><h2>WHAT MOVES <em>YOU?</em></h2><Link to="/#collection">STEP INSIDE THE GARAGE <span aria-hidden="true"><Icon name="arrow-up-right"/></span></Link></section>
      <SiteFooter />
    </main>
  );
}


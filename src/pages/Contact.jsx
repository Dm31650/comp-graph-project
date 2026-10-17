import Icon from '../components/Icon';
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { SiteHeader, SiteFooter } from "../components/SiteChrome";
import { downloadText } from "../cart/cart";
import "./Shop.css";
const contactEmail = (import.meta.env.VITE_CONTACT_EMAIL || "").trim();
const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);
export default function Contact() {
  const [message, setMessage] = useState("");
  useEffect(() => {document.title = "Contact Us | Limitless-Deal Hub"; window.scrollTo(0,0); return () => {document.title = "Limitless-Deal Hub";};}, []);
  const submit = event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = `Name: ${data.get("name").trim()}\nEmail: ${data.get("email").trim()}\nTopic: ${data.get("topic")}\n\n${data.get("message").trim()}`;
    if (!data.get("name").trim() || !data.get("message").trim()) {setMessage("Please enter your name and a message, using more than spaces."); return;}
    if (hasEmail) {
      window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`Showroom inquiry: ${data.get("topic")}`)}&body=${encodeURIComponent(body)}`;
      setMessage("Your email app has been requested. Send the prepared message there to deliver your inquiry. If it does not open, use the email address below.");
    } else { downloadText("limitless-inquiry.txt", body); setMessage("Your inquiry was downloaded. It has not been sent; a contact address has not been connected yet."); }
  };
  return <main className="shop-page"><SiteHeader/><div className="shop-container"><div className="shop-intro"><p className="eyebrow">LET’S START A CONVERSATION</p><h1>CONTACT <span>US.</span></h1><p>A question about a car, a design idea, or feedback on the showroom? We’re listening.</p></div><div className="contact-layout"><section className="contact-copy"><p className="eyebrow">DRIVEN BY CURIOSITY</p><h2>Great ideas start<br/>with a hello.</h2><p>Tell us what caught your eye. Include the vehicle name if you’re asking about a model or a custom design.</p>{hasEmail ? <a className="contact-address" href={`mailto:${contactEmail}`}>{contactEmail} <Icon name="arrow-up-right"/></a> : <div className="shop-notice"><h3>Contact details coming soon.</h3><p>You can prepare and download an inquiry here. Message delivery will be available once a contact address is connected.</p></div>}<div className="contact-topics"><h3>What’s on your mind?</h3><p>01 / Vehicle & 3D model questions</p><p>02 / Customization ideas</p><p>03 / Feedback & collaborations</p></div><Link to="/#collection">Back to the collection <Icon name="arrow-up-right"/></Link></section><form className="contact-form" onSubmit={submit} onChange={() => setMessage("")}><h2>Tell us more.</h2><div className="contact-fields"><label>Your name<input name="name" autoComplete="name" required maxLength="100" placeholder="Full name"/></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength="254" placeholder="you@example.com"/></label></div><label>What can we help with?<select name="topic"><option>Vehicle inquiry</option><option>Car customization</option><option>Project feedback</option><option>Collaboration</option><option>Something else</option></select></label><label>Your message<textarea name="message" rows="7" minLength="10" maxLength="3000" required placeholder="Tell us about it…"/></label><p>{hasEmail ? "This form prepares an email in your email app. Review and send it there. Your message is not stored on this website." : "This form downloads your inquiry as a text file. It does not send a message or store your contact details on this website."}</p><button className="shop-button" type="submit">{hasEmail ? "Prepare email" : "Download inquiry"} <Icon name="arrow-up-right"/></button><p role="status" className="contact-status">{message}</p></form></div></div><SiteFooter/></main>;
}

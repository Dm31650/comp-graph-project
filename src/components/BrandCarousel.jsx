import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { cars } from '../data/cars';
import { brandLogos } from '../data/brands';
import Icon from './Icon';

export default function BrandCarousel(){
 const rail=useRef(),group=useRef(),hovered=useRef(false),focused=useRef(false),held=useRef(false),manualUntil=useRef(0);
 const [paused,setPaused]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const brands=[...new Set(cars.map(c=>c.brand))];
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');let frame,last=0,position=rail.current?.scrollLeft||0;
  const stop=()=>{if(media.matches)setPaused(true);};media.addEventListener('change',stop);
  const animate=time=>{
   const delta=Math.min(40,time-(last||time));last=time;
   const node=rail.current,width=group.current?.offsetWidth||0;
   if(node&&width&&!paused&&!hovered.current&&!focused.current&&!held.current&&!document.hidden&&time>manualUntil.current){position+=delta*.035;if(position>=width)position-=width;node.scrollLeft=position;}else if(node){position=node.scrollLeft;}
   frame=requestAnimationFrame(animate);
  };frame=requestAnimationFrame(animate);
  return()=>{cancelAnimationFrame(frame);media.removeEventListener('change',stop);};
 },[paused]);
 const move=direction=>{manualUntil.current=performance.now()+4000;rail.current?.scrollBy({left:direction*260,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 return <section className="brand-gallery" aria-label="Browse by marque"><div className="brand-gallery-heading"><div><p className="eyebrow">EXTRAORDINARY MARQUES. ONE DESTINATION.</p><h2>Find your signature.</h2></div><div><button onClick={()=>setPaused(v=>!v)} aria-label={paused?'Resume automatic brand carousel':'Pause automatic brand carousel'} aria-pressed={paused}><Icon name={paused?'play':'pause'}/></button><button onClick={()=>move(-1)} aria-label="Previous brands"><Icon name="arrow-left"/></button><button onClick={()=>move(1)} aria-label="Next brands"><Icon name="arrow-right"/></button></div></div>
 <div ref={rail} className="brand-gallery-rail brand-autoplay" onMouseEnter={()=>{hovered.current=true;}} onMouseLeave={()=>{hovered.current=false;}} onFocusCapture={()=>{focused.current=true;}} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))focused.current=false;}} onPointerDown={()=>{held.current=true;}} onPointerUp={()=>{held.current=false;manualUntil.current=performance.now()+2500;}} onPointerCancel={()=>{held.current=false;}} onPointerLeave={()=>{held.current=false;}} onWheel={()=>{manualUntil.current=performance.now()+3000;}}>
 {[false,true].map(copy=><div className="brand-carousel-group" key={String(copy)} ref={copy?undefined:group} aria-hidden={copy?true:undefined}>{brands.map(brand=>{const count=cars.filter(c=>c.brand===brand).length;return <Link key={brand} tabIndex={copy?-1:0} to={`/?brand=${encodeURIComponent(brand)}#collection`} onClick={()=>document.getElementById('collection')?.scrollIntoView()} className="brand-gallery-card"><div className="brand-logo-wrap"><img src={`/images/brands/${brandLogos[brand]}`} alt="" loading="eager" width="150" height="90"/></div><span>{brand}</span><small>{count} {count===1?'vehicle':'vehicles'} <Icon name="arrow-up-right"/></small></Link>;})}</div>)}
 </div><p className="brand-carousel-hint">Explore a marque to filter the collection. Swipe to browse.</p></section>;
}
export function DriveInvitation(){return <section className="drive-invitation"><div className="drive-invitation-art"><img src="/images/cars/ferrari-f8.jpg" alt="Ferrari F8 Tributo in the collection" loading="lazy"/><span>DESIGN IT. DRIVE IT.</span></div><div className="drive-invitation-copy"><p className="eyebrow">THE STREETS ARE CALLING</p><h2>From your imagination.<br/><em>Into the city.</em></h2><p>Choose your paint. Make it yours. Then take your creation out into a living 3D city, from golden-hour streets to a midnight speed run.</p><div><Link className="premium-action" to="/cars/7#customize-car">Build your Ferrari <Icon name="arrow-up-right"/></Link><Link to="/test-drive/7">Explore City Drive <Icon name="arrow-right"/></Link></div><ul><li>Custom designs</li><li>Day & night</li><li>Touch & keyboard</li></ul></div></section>;}

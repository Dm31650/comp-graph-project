import { useAuth } from '../auth/AuthContext';
import { garageRequest } from '../auth/garageApi';
import { normalizeDesign } from '../cart/cart';
import { Link, useLocation } from 'react-router';
import AddToCartButton from "./AddToCartButton";
import { useEffect, useState } from "react";
import "./CarCustomizer.css";
import CarViewer from "./CarViewer";
import { carModels } from "../data/carModels";
import { getCustomizationProfile } from "./carCustomization";

const paints = [["Arctic Silver", "#aeb9c6"], ["Lava Orange", "#ff6534"], ["Racing Green", "#18785f"], ["Midnight Blue", "#2456a8"], ["Crimson Red", "#bd283e"], ["Pearl White", "#eeeae2"], ["Carbon Black", "#292c34"]];
const defaults = { paint: "#aeb9c6", finish: "Gloss", design: "Clean", accent: "#ff6534", wheels: "#b9bec7", tint: 45, studio: "Daylight", targets: {} };

function readBuild(carId) {
  try {
    const saved = JSON.parse(localStorage.getItem(`car-build-${carId}`));
    if (saved && /^#[0-9a-f]{6}$/i.test(saved.paint) && /^#[0-9a-f]{6}$/i.test(saved.accent) && /^#[0-9a-f]{6}$/i.test(saved.wheels) && ["Gloss", "Matte", "Metallic"].includes(saved.finish) && ["Clean", "Racing stripes", "Heritage", "Track number"].includes(saved.design) && Number.isFinite(saved.tint) && saved.tint >= 0 && saved.tint <= 85) return { ...defaults, ...saved, studio: ["Daylight", "Warm", "Track"].includes(saved.studio) ? saved.studio : "Daylight", targets: Object.fromEntries(Object.entries(saved.targets || {}).filter(([role, ids]) => ["paint", "wheels", "glass"].includes(role) && Array.isArray(ids)).map(([role, ids]) => [role, ids.filter(id => typeof id === "string" && /^part:\d+:\d+$/.test(id))])) };
  } catch { /* Storage may be unavailable or contain an old build. */ }
  return { ...defaults };
}

export default function CarCustomizer({ car }) {
  const { user } = useAuth();
  const location = useLocation();
  const [saving,setSaving] = useState(false);
  const [designName,setDesignName] = useState(car.brand + ' ' + car.name + ' / My design');
  const draftKey = user ? 'car-build-' + user.id + '-' + car.id : 'car-build-' + car.id;
  const [build, setBuild] = useState(() => normalizeDesign(location.state?.savedDesign) || readBuild(user ? user.id + '-' + car.id : car.id));
  useEffect(() => { if(location.state?.savedDesign) {setBuild(normalizeDesign(location.state.savedDesign)); document.getElementById('customize-car')?.scrollIntoView();} }, [location.key]);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [target, setTarget] = useState("paint");
  const [picking, setPicking] = useState(false);
  const model = carModels[car.id];
  const profile = getCustomizationProfile(model?.url || "");
  const hasWheels = profile.wheels.length > 0 || Boolean(build.targets?.wheels?.length);
  const update = (key, value) => { setBuild((previous) => ({ ...previous, [key]: value })); setMessage(""); };
  const paintName = paints.find(([, color]) => color === build.paint)?.[0] || build.paint.toUpperCase();
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(build));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [build, draftKey]);
  return (
    <section id="customize-car" className="car-customizer" aria-labelledby="customizer-title" tabIndex={-1}>
      <div className="customizer-heading"><p className="eyebrow">YOUR VISION. YOUR SIGNATURE.</p><h2 id="customizer-title">CUSTOMIZE <span>YOUR CAR.</span></h2><p>Make the {car.brand} {car.name} your own. Explore colors, graphics and finishing touches.</p></div>
      <div className="customizer-layout">
        <div className="customizer-preview">
          <div className="customizer-preview-label"><span>LIVE 3D CUSTOMIZER</span><span>{car.brand} / {car.name}</span></div>
          {model ? <div className="customizer-3d-viewer"><CarViewer modelUrl={model.url} modelRotation={model.rotation || 0} modelName={`${car.brand} ${car.name}`} customization={build} studio={build.studio} onPartSelect={picking ? (id) => { if (!id) return; setBuild(previous => ({ ...previous, targets: Object.fromEntries(["paint", "wheels", "glass"].map(role => [role, role === target ? [...new Set([...(previous.targets[role] || []), id])] : (previous.targets[role] || []).filter(item => item !== id)])) })); setMessage(target === "wheels" ? "Wheel selected. Pick more wheel pieces or finish selection." : "Part selected. Pick more pieces or finish selection."); } : undefined} /></div> : <p>No 3D model is available for this vehicle.</p>}
          <div className="customizer-summary" aria-live="polite"><strong>{paintName}</strong><span>{build.finish} · {build.design} · {build.tint}% tint · {build.studio} studio</span></div>
          <p className="customizer-disclaimer">Drag to rotate. Scroll to zoom. Only selected pieces change. Select each wheel you want to finish.</p>
        </div>
        <div className="customizer-controls">
          <fieldset><legend>SELECT A MODEL PART</legend><p className="customizer-status">Choose a category before selecting extra pieces. Wheel selections remain separate from body paint.</p><label className="customizer-color">Apply as <select value={target} onChange={(event) => { setTarget(event.target.value); setPicking(false); }}><option value="paint">Body paint</option><option value="wheels">Wheel finish</option><option value="glass">Window tint</option></select></label><div className="customizer-options"><button type="button" aria-pressed={picking} onClick={() => setPicking(!picking)}>{picking ? "Finish selection" : "Pick a part in 3D"}</button></div>{picking && <p role="status" className="customizer-status">Click the {target === "wheels" ? "wheel rims" : target === "paint" ? "body panels" : "windows"} on the car.</p>}</fieldset>
          <fieldset><legend>01 / BODY COLOR</legend><div className="paint-swatches">{paints.map(([name, color]) => <button type="button" key={color} title={name} aria-label={name} aria-pressed={build.paint === color} style={{ "--swatch": color }} onClick={() => update("paint", color)}/>)}</div><label className="customizer-color">Custom paint <input type="color" value={build.paint} onChange={(event) => update("paint", event.target.value)}/></label></fieldset>
          <fieldset><legend>02 / PAINT FINISH</legend><div className="customizer-options">{["Gloss", "Matte", "Metallic"].map((finish) => <button type="button" key={finish} aria-pressed={build.finish === finish} onClick={() => update("finish", finish)}>{finish}</button>)}</div></fieldset>
          <fieldset><legend>03 / DESIGN</legend><div className="customizer-options">{["Clean", "Racing stripes", "Heritage", "Track number"].map((design) => <button type="button" key={design} aria-pressed={build.design === design} onClick={() => update("design", design)}>{design}</button>)}</div><label className="customizer-color">Graphic color <input type="color" value={build.accent} onChange={(event) => update("accent", event.target.value)}/></label></fieldset>
          <fieldset><legend>04 / FINISHING TOUCHES</legend><div className="customizer-options"><button type="button" aria-pressed={picking && target === "wheels"} onClick={() => { setTarget("wheels"); setPicking(true); setMessage("Click a wheel rim in the 3D view. Finish selection when done."); }}>Select wheels in 3D</button></div><label className="customizer-color">Wheel finish <select disabled={!hasWheels} value={build.wheels} onChange={(event) => update("wheels", event.target.value)}><option value="#b9bec7">Silver</option><option value="#25272d">Black</option><option value="#c29b55">Gold</option></select></label>{!hasWheels && <p className="customizer-status">Select the wheel rims in 3D to enable their finish. A model may combine a rim and tire into one piece.</p>}<label className="customizer-tint">Window tint <span>{build.tint}%</span><input type="range" min="0" max="85" value={build.tint} onChange={(event) => update("tint", Number(event.target.value))}/></label></fieldset>
          <fieldset><legend>05 / THREE.JS LIGHTING STUDIO</legend><p className="customizer-status">See how the same paint and wheel finish respond to different light.</p><div className="customizer-options">{["Daylight", "Warm", "Track"].map((studio) => <button type="button" key={studio} aria-pressed={build.studio === studio} onClick={() => update("studio", studio)}>{studio}</button>)}</div></fieldset>
          <AddToCartButton car={car} design={build} /><Link className="vehicle-collection-button" to="/experience" state={{carId:car.id,design:build}}>Experience my design in 3D ↗</Link>
          <label className="customizer-color">Design name<input value={designName} maxLength={80} onChange={event=>setDesignName(event.target.value)}/></label><div className="customizer-actions"><button type="button" className="vehicle-collection-button" disabled={saving} onClick={async () => { setSaving(true); try { if(user) {await garageRequest('designs','POST',{carId:car.id,name:designName,design:build}); setMessage('Design saved to your profile.');} else {localStorage.setItem(draftKey,JSON.stringify(build));setMessage('Design saved in this browser. Sign in to save designs to your profile.');} } catch(error) {setMessage(error.message);} finally {setSaving(false);} }}>{saving ? 'Saving…' : user ? 'Save to my profile ↗' : 'Save my design ↗'}</button><button type="button" onClick={() => { setBuild({ ...defaults }); setPicking(false); setMessage("Design reset and saved."); }}>Reset</button></div>
          <p className="customizer-status" role="status">{message || (saveError ? "This browser blocked saving. Your current preview remains active." : "Your design saves automatically in this browser for this vehicle." )}</p>
        </div>
      </div>
    </section>
  );
}

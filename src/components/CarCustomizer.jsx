import AddToCartButton from "./AddToCartButton";
import { useState } from "react";
import "./CarCustomizer.css";
import CarViewer from "./CarViewer";
import { carModels } from "../data/carModels";
import { getCustomizationProfile } from "./carCustomization";

const paints = [["Arctic Silver", "#aeb9c6"], ["Lava Orange", "#ff6534"], ["Racing Green", "#18785f"], ["Midnight Blue", "#2456a8"], ["Crimson Red", "#bd283e"], ["Pearl White", "#eeeae2"], ["Carbon Black", "#292c34"]];
const defaults = { paint: "#aeb9c6", finish: "Gloss", design: "Clean", accent: "#ff6534", wheels: "#b9bec7", tint: 45 };

function readBuild(carId) {
  try {
    const saved = JSON.parse(localStorage.getItem(`car-build-${carId}`));
    if (saved && /^#[0-9a-f]{6}$/i.test(saved.paint) && /^#[0-9a-f]{6}$/i.test(saved.accent) && /^#[0-9a-f]{6}$/i.test(saved.wheels) && ["Gloss", "Matte", "Metallic"].includes(saved.finish) && ["Clean", "Racing stripes", "Heritage", "Track number"].includes(saved.design) && Number.isFinite(saved.tint) && saved.tint >= 0 && saved.tint <= 85) return saved;
  } catch { /* Storage may be unavailable or contain an old build. */ }
  return { ...defaults };
}

export default function CarCustomizer({ car }) {
  const [build, setBuild] = useState(() => readBuild(car.id));
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("paint");
  const [picking, setPicking] = useState(false);
  const model = carModels[car.id];
  const profile = getCustomizationProfile(model?.url || "");
  const hasWheels = profile.wheels.length > 0 || Boolean(build.targets?.wheels);
  const update = (key, value) => { setBuild((previous) => ({ ...previous, [key]: value })); setMessage(""); };
  const paintName = paints.find(([, color]) => color === build.paint)?.[0] || build.paint.toUpperCase();
  return (
    <section id="customize-car" className="car-customizer" aria-labelledby="customizer-title" tabIndex={-1}>
      <div className="customizer-heading"><p className="eyebrow">YOUR VISION. YOUR SIGNATURE.</p><h2 id="customizer-title">CUSTOMIZE <span>YOUR CAR.</span></h2><p>Make the {car.brand} {car.name} your own. Explore colors, graphics and finishing touches.</p></div>
      <div className="customizer-layout">
        <div className="customizer-preview">
          <div className="customizer-preview-label"><span>LIVE 3D CUSTOMIZER</span><span>{car.brand} / {car.name}</span></div>
          {model ? <div className="customizer-3d-viewer"><CarViewer modelUrl={model.url} modelRotation={model.rotation || 0} modelName={`${car.brand} ${car.name}`} customization={build} onPartSelect={picking ? (name) => { update("targets", { ...build.targets, [target]: name }); setPicking(false); setMessage(`Selected material: ${name}.`); } : undefined} /></div> : <p>No 3D model is available for this vehicle.</p>}
          <div className="customizer-summary" aria-live="polite"><strong>{paintName}</strong><span>{build.finish} · {build.design} · {build.tint}% tint</span></div>
          <p className="customizer-disclaimer">Drag to rotate. Scroll to zoom. Parts sharing a material change together.</p>
        </div>
        <div className="customizer-controls">
          <fieldset><legend>SELECT A MODEL PART</legend><p className="customizer-status">Body and glass are mapped automatically. Pick an extra material to customize a specific part.</p><label className="customizer-color">Apply as <select value={target} onChange={(event) => { setTarget(event.target.value); setPicking(false); }}><option value="paint">Body paint</option><option value="wheels">Wheel finish</option><option value="glass">Window tint</option></select></label><div className="customizer-options"><button type="button" aria-pressed={picking} onClick={() => setPicking(!picking)}>{picking ? "Cancel part selection" : "Pick a part in 3D"}</button></div>{picking && <p role="status" className="customizer-status">Click the part on the car to assign its material.</p>}</fieldset>
          <fieldset><legend>01 / BODY COLOR</legend><div className="paint-swatches">{paints.map(([name, color]) => <button type="button" key={color} title={name} aria-label={name} aria-pressed={build.paint === color} style={{ "--swatch": color }} onClick={() => update("paint", color)}/>)}</div><label className="customizer-color">Custom paint <input type="color" value={build.paint} onChange={(event) => update("paint", event.target.value)}/></label></fieldset>
          <fieldset><legend>02 / PAINT FINISH</legend><div className="customizer-options">{["Gloss", "Matte", "Metallic"].map((finish) => <button type="button" key={finish} aria-pressed={build.finish === finish} onClick={() => update("finish", finish)}>{finish}</button>)}</div></fieldset>
          <fieldset><legend>03 / DESIGN</legend><div className="customizer-options">{["Clean", "Racing stripes", "Heritage", "Track number"].map((design) => <button type="button" key={design} aria-pressed={build.design === design} onClick={() => update("design", design)}>{design}</button>)}</div><label className="customizer-color">Graphic color <input type="color" value={build.accent} onChange={(event) => update("accent", event.target.value)}/></label></fieldset>
          <fieldset><legend>04 / FINISHING TOUCHES</legend><label className="customizer-color">Wheel finish <select disabled={!hasWheels} value={build.wheels} onChange={(event) => update("wheels", event.target.value)}><option value="#b9bec7">Silver</option><option value="#25272d">Black</option><option value="#c29b55">Gold</option></select></label>{!hasWheels && <p className="customizer-status">Pick a wheel part above to enable its finish. Some models share wheel and tire materials.</p>}<label className="customizer-tint">Window tint <span>{build.tint}%</span><input type="range" min="0" max="85" value={build.tint} onChange={(event) => update("tint", Number(event.target.value))}/></label></fieldset>
          <AddToCartButton car={car} design={build} />
          <div className="customizer-actions"><button type="button" className="vehicle-collection-button" onClick={() => { try { localStorage.setItem(`car-build-${car.id}`, JSON.stringify(build)); setMessage("Design saved on this browser."); } catch { setMessage("Saving is unavailable in this browser. Your preview is still active."); } }}>Save my design ↗</button><button type="button" onClick={() => { setBuild({ ...defaults }); setPicking(false); setMessage("Preview reset. Save to replace your saved design."); }}>Reset</button></div>
          <p className="customizer-status" role="status">{message || "Saved designs stay on this browser, separately for each vehicle."}</p>
        </div>
      </div>
    </section>
  );
}

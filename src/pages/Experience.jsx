import Icon from '../components/Icon';
import { Component, Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, Html } from '@react-three/drei';
import { Link, useLocation } from 'react-router';
import { Vector3 } from 'three';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';
import CarModel from '../components/CarModel';
import { cars } from '../data/cars';
import { carModels } from '../data/carModels';
import { normalizeDesign } from '../cart/cart';
import { useAuth } from '../auth/AuthContext';
import { garageRequest } from '../auth/garageApi';
import './Experience.css';

const modes=['Night drive','Showcase','Details','Compare','My garage'];
const base=normalizeDesign({});
const viewpoints={Front:[-7,2,-8],Side:[8,2,0],Rear:[7,2,8],Wheels:[4,1,3],Cabin:[4,4,3],Power:[-5,3,-5]};
class SceneBoundary extends Component {
 state={failed:false};static getDerivedStateFromError(){return{failed:true};}
 render(){return this.state.failed?<div className="experience-fallback">This model could not load. Choose another car or reload the page.</div>:this.props.children;}
}
function CameraRig({controls,view,tour,wide,paused}){
 const {camera}=useThree();const elapsed=useRef(0);const destination=useRef(new Vector3(...viewpoints.Front));const moving=useRef(true);
 useEffect(()=>{destination.current.set(...(viewpoints[view]||viewpoints.Front)).multiplyScalar(wide?1.6:1);moving.current=true;elapsed.current=0;},[view,wide,tour]);
 useFrame((_,delta)=>{
  const dt=Math.min(delta,.05);
  if(tour&&!paused){elapsed.current+=dt;const order=['Front','Wheels','Side','Rear'];destination.current.set(...viewpoints[order[Math.floor(elapsed.current/5)%4]]);moving.current=true;}
  if(moving.current){camera.position.lerp(destination.current,1-Math.exp(-dt*3));if(controls.current){controls.current.target.lerp(new Vector3(0,0,0),.1);controls.current.update();}if(camera.position.distanceTo(destination.current)<.025)moving.current=false;}
 });
 return null;
}
function Tunnel({speed,paused,color,braking}){
 const road=useRef();
 useFrame((_,delta)=>{if(!paused&&road.current)road.current.position.z=(road.current.position.z+Math.min(delta,.05)*speed*.15)%5;});
 return <group><mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.08,0]}><planeGeometry args={[22,130]}/><meshStandardMaterial color="#080c14" metalness={.65} roughness={.3}/></mesh><group ref={road}>{Array.from({length:24},(_,i)=><group key={i} position={[0,0,i*5-65]}><mesh position={[0,-1.06,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.12,2]}/><meshBasicMaterial color="#b6c8de"/></mesh>{[-5,5].map(x=><mesh key={x} position={[x,1.8,0]}><boxGeometry args={[.06,5,.1]}/><meshBasicMaterial color={color}/></mesh>)}<mesh position={[0,4.3,0]}><boxGeometry args={[10,.06,.1]}/><meshBasicMaterial color={color}/></mesh></group>)}</group><pointLight position={[0,1,3]} color={braking?'#ff162f':color} intensity={braking?30:10}/></group>;
}
function Capture({capture,ready,onDone}){
 const {gl,scene,camera}=useThree();
 useEffect(()=>{if(!capture||!ready)return;try{gl.render(scene,camera);const link=document.createElement('a');link.download='limitless-my-design.png';link.href=gl.domElement.toDataURL('image/png');link.click();onDone('Your scene image has been downloaded.');}catch{onDone('Image download was unavailable. Try again after the model loads.');}},[capture]);
 return null;
}
function Vehicle({carId,design,position=[0,0,0],scale=1,speed=0,onReady}){const model=carModels[carId];return <group position={position} scale={scale}><CarModel modelUrl={model.url} modelRotation={model.rotation||0} customization={design} skip driveSpeed={speed} onReady={onReady}/></group>;}
function Lights({enabled,braking}){return <group>{[-.7,.7].map(x=><group key={x}><mesh position={[x,-.1,-2.7]}><sphereGeometry args={[.065,12,8]}/><meshBasicMaterial color={enabled?'#e9f6ff':'#333'}/></mesh>{enabled&&<pointLight position={[x,-.4,-3.4]} intensity={20} distance={10} color="#e9f6ff"/>}<mesh position={[x,0,2.7]}><boxGeometry args={[.4,.08,.03]}/><meshBasicMaterial color={braking?'#ff1838':'#661327'}/></mesh></group>)}</group>;}

export default function Experience(){
 const location=useLocation();const {user}=useAuth();const initial=location.state || {};
 const [mode,setMode]=useState(initial.mode||'Night drive');const [carId,setCarId]=useState(initial.carId||1);const [design,setDesign]=useState(normalizeDesign(initial.design)||base);
 const [saved,setSaved]=useState([]);const [loadError,setLoadError]=useState('');const [loadingSaved,setLoadingSaved]=useState(false);const [selected,setSelected]=useState('');const [comparison,setComparison]=useState({...base,paint:'#18785f',wheels:'#c29b55'});
 const [paused,setPaused]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);const [light,setLight]=useState('#578dff');const [speed,setSpeed]=useState(70);const [braking,setBraking]=useState(false);const [headlights,setHeadlights]=useState(true);const [view,setView]=useState('Front');const [tour,setTour]=useState(false);const [lite,setLite]=useState(()=>innerWidth<700);const [capture,setCapture]=useState(0);const [readyKey,setReadyKey]=useState('');const [notice,setNotice]=useState('');const [detail,setDetail]=useState('Power');const [page,setPage]=useState(0);
 const controls=useRef();const car=cars.find(c=>c.id===carId)||cars[0];const wide=mode==='Compare'||mode==='My garage';
 const sceneKey=`${mode}-${carId}`;const ready=readyKey===sceneKey;const modelReady=useCallback(()=>setReadyKey(sceneKey),[sceneKey]);
 useEffect(()=>{setTour(false);setView('Front');setNotice('');},[mode]);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{if(media.matches){setPaused(true);setTour(false);}};media.addEventListener('change',update);const hide=()=>{if(document.hidden){setPaused(true);setTour(false);}};document.addEventListener('visibilitychange',hide);return()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',hide);};},[]);
 const loadSaved=()=>{if(!user){setSaved([]);return;}setLoadingSaved(true);garageRequest('designs').then(result=>{setSaved(result.designs);setLoadError('');}).catch(error=>setLoadError(error.message)).finally(()=>setLoadingSaved(false));};
 useEffect(()=>{loadSaved();},[user?.id]);
 const choose=id=>{const item=saved.find(d=>d.id===id);setSelected(id);if(item){setCarId(item.carId);setDesign(item.design);}};
 const changeCar=value=>{setCarId(Number(value));setSelected('');setDesign(base);setComparison({...base,paint:'#18785f',wheels:'#c29b55'});};
 const bayCount=lite?1:3;
 const slots=saved.slice(page*bayCount,page*bayCount+bayCount);
 useEffect(()=>{setPage(0);},[lite]);
 const info={Power:`${car.horsepower} HP · ${car.acceleration} from 0–100 km/h · ${car.fuel}`,Wheels:`Wheel finish ${design.wheels.toUpperCase()}. Open customization to select and finish individual wheel pieces.`,Cabin:`${car.transmission} · ${car.year} model. Exterior inspection; interior access depends on the source model.`};
 return <main className="website"><SiteHeader/><div className="experience-shell"><header className="experience-intro"><p className="eyebrow">LIMITLESS / AFTER HOURS</p><h1>BEYOND THE <span>SHOWROOM.</span></h1><p>Your design. Five ways to experience it.</p></header>
 <div className="experience-tabs" aria-label="Choose experience">{modes.map(item=><button key={item} aria-pressed={mode===item} onClick={()=>setMode(item)}>{item}</button>)}</div>
 <div className="experience-toolbar"><label>Vehicle<select value={carId} onChange={e=>changeCar(e.target.value)}>{cars.map(c=><option key={c.id} value={c.id}>{c.brand} {c.name}</option>)}</select></label>{user&&<label>Saved design<select value={selected} onChange={e=>choose(e.target.value)}><option value="">Current / custom design</option>{saved.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}<label>Paint<input type="color" value={design.paint} onChange={e=>setDesign({...design,paint:e.target.value})}/></label><label><input type="checkbox" checked={lite} onChange={e=>setLite(e.target.checked)}/> Lightweight mode</label></div>
 {loadError&&<p role="alert">{loadError} <button onClick={loadSaved}>Retry designs</button></p>}
 <div className="experience-stage"><SceneBoundary key={`${mode}-${carId}`}><Canvas camera={{position:[-7,2,-8],fov:45}} dpr={lite?1:[1,1.5]} gl={{antialias:!lite,preserveDrawingBuffer:true}}><color attach="background" args={['#090d16']}/><ambientLight intensity={mode==='Night drive'?.5:1}/><directionalLight position={[5,8,-5]} intensity={3}/><pointLight position={[-4,3,0]} color={light} intensity={25}/><Suspense fallback={<Html center><span className="scene-loading">Loading your 3D car…</span></Html>}>
 <Environment resolution={lite?64:128}><Lightformer position={[0,5,0]} rotation={[Math.PI/2,0,0]} scale={[10,4,1]} intensity={3}/><Lightformer position={[-5,2,0]} rotation={[0,Math.PI/2,0]} scale={[8,3,1]} color={light} intensity={4}/></Environment>
 {mode==='My garage'?<>{slots.map((item,i)=><group key={item.id} position={[(i-(slots.length-1)/2)*5,0,0]}><Vehicle carId={item.carId} design={item.design} scale={.65}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-1,0]} onClick={()=>{choose(item.id);setMode('Showcase');}}><planeGeometry args={[4,6]}/><meshStandardMaterial color={item.design.paint} metalness={.5} roughness={.5}/></mesh><Html position={[0,1.6,0]} center><button className="garage-slot" onClick={()=>{choose(item.id);setMode('Showcase');}}>{item.name} <Icon name="arrow-up-right"/></button></Html></group>)}<gridHelper args={[30,30,'#ff6534','#283144']} position={[0,-1.05,0]}/></>:mode==='Compare'?<><Vehicle carId={carId} design={design} position={[-3.3,0,0]} onReady={modelReady}/><Vehicle carId={carId} design={comparison} position={[3.3,0,0]}/><Html position={[-3.3,2,0]} center><span className="scene-loading">DESIGN A</span></Html><Html position={[3.3,2,0]} center><span className="scene-loading">DESIGN B</span></Html></>:<><Vehicle carId={carId} design={design} speed={mode==='Night drive'&&!paused&&!braking?speed:0} onReady={modelReady}/>{mode==='Night drive'&&<Lights enabled={headlights} braking={braking}/>}</>}
 {mode==='Night drive'?<Tunnel speed={braking?0:speed} paused={paused} color={light} braking={braking}/>:<mesh position={[0,-1.08,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[50,50]}/><meshStandardMaterial color="#151c29" metalness={.4} roughness={.4}/></mesh>}
 {mode==='Details'&&[['Power',[-1,1,-1.7]],['Wheels',[1.2,-.3,1.6]],['Cabin',[0,1,0]]].map(([label,position])=><Html key={label} position={position} center><button className="detail-hotspot" onClick={()=>{setDetail(label);setView(label);}}>{label} <Icon name="plus"/></button></Html>)}
 </Suspense><OrbitControls ref={controls} makeDefault enablePan={false} enabled={!tour} minDistance={4} maxDistance={25} maxPolarAngle={Math.PI/2.1}/><CameraRig controls={controls} view={view} tour={tour&&mode==='Showcase'} wide={wide} paused={paused}/><Capture capture={capture} ready={ready} onDone={setNotice}/></Canvas></SceneBoundary><div className="stage-caption"><span>{mode.toUpperCase()}</span><span>{car.brand} / {car.name}</span></div></div>
 <div className="experience-controls"><div className="camera-buttons">{['Front','Side','Rear'].map(v=><button key={v} onClick={()=>{setTour(false);setView(v);}}>{v} view</button>)}<button onClick={()=>setPaused(!paused)}>{paused?'Resume motion':'Pause motion'}</button></div>
 {mode==='Night drive'&&<><label>Road speed {speed}<input type="range" min="0" max="140" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/></label><label>Light color<input type="color" value={light} onChange={e=>setLight(e.target.value)}/></label><button aria-pressed={headlights} onClick={()=>setHeadlights(!headlights)}>Headlights {headlights?'on':'off'}</button><button aria-pressed={braking} onClick={()=>setBraking(!braking)}>{braking?'Release brakes':'Brake'}</button><p>Stylized driving scene. Lights are scene effects; only separately modeled wheel pieces rotate.</p></>}
 {mode==='Showcase'&&<><button onClick={()=>{setTour(!tour);setPaused(false);}}>{tour?'Stop camera tour':'Showcase my design'}</button><button disabled={!ready} onClick={()=>setCapture(c=>c+1)}>Download scene PNG <Icon name="arrow-up-right"/></button><p>Front <Icon name="arrow-right"/> wheels <Icon name="arrow-right"/> side <Icon name="arrow-right"/> rear. Stop the tour to rotate freely.</p></>}
 {mode==='Details'&&<div className="detail-info"><h2>{detail}</h2><p>{info[detail]}</p><p>Markers identify general viewing areas, not exact mechanical locations.</p></div>}
 {mode==='Compare'&&<><label>Design B paint<input type="color" value={comparison.paint} onChange={e=>setComparison({...comparison,paint:e.target.value})}/></label><label>Design B wheels<input type="color" value={comparison.wheels} onChange={e=>setComparison({...comparison,wheels:e.target.value})}/></label><label>Design B finish<select value={comparison.finish} onChange={e=>setComparison({...comparison,finish:e.target.value})}>{['Gloss','Matte','Metallic'].map(v=><option key={v}>{v}</option>)}</select></label><label>Saved design B<select value="" onChange={e=>{const item=saved.find(d=>d.id===e.target.value);if(item)setComparison(item.design);}}><option value="">Choose configuration</option>{saved.filter(d=>d.carId===carId).map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label><p>One shared camera keeps both configurations at the same angle.</p></>}
 {mode==='My garage'&&<>{!user?<p><Link to="/sign-in">Sign in</Link> to open your saved garage.</p>:loadingSaved?<p>Loading your garage…</p>:!saved.length?<p>No saved designs yet. Customize a car and save it to your profile.</p>:<><p>Select a parking spot to bring its design into the showroom.</p><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous bays</button><span>{page+1} / {Math.ceil(saved.length/bayCount)}</span><button disabled={(page+1)*bayCount>=saved.length} onClick={()=>setPage(p=>p+1)}>Next bays</button></>}</>}
 </div><p role="status">{notice}</p><Link className="experience-customize" to={`/cars/${carId}#customize-car`} state={{savedDesign:design}}>Continue customizing this design <Icon name="arrow-up-right"/></Link><p className="experience-credit">Model: <a href={carModels[carId].source} target="_blank" rel="noreferrer">{carModels[carId].title}</a> by {carModels[carId].author} · {carModels[carId].license}</p></div><SiteFooter/></main>;
}

import CityDetails from './CityDetails';
import { STREETS, BLOCKS, CITY_EDGE, roadDistance } from './cityLayout';
import { stepVehicle } from './drivingPhysics';
import CityLife from './CityLife';
import VehicleLighting from './VehicleLighting';
import DriveSky from './DriveSky';
import { Component, Suspense, memo, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, Html, Instances, Instance } from '@react-three/drei';
import { Link, useLocation, useParams } from 'react-router';
import { Vector3 } from 'three';
import CarModel from '../components/CarModel';
import Icon from '../components/Icon';
import { cars } from '../data/cars';
import { carModels } from '../data/carModels';
import { normalizeDesign } from '../cart/cart';
import './TestDrive.css';

// Arcade limits in km/h, not manufacturer performance claims.
const DRIVE_LIMITS = {1:300,2:290,3:310,4:305,5:300,6:305};
const CAMERAS = ['Chase', 'Front', 'Left', 'Right', 'Overhead', 'Free'];
const spawn = () => ({x:3,z:18,yaw:0,speed:0,steer:0,acceleration:0,distance:0,hit:0,time:0,peak:0});
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));

class DriveBoundary extends Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="drive-error"><h2>The 3D scene could not load.</h2><p>Return to customization and try again.</p><Link to="/#collection">Back to collection</Link></div>:this.props.children;}
}
function Box({position,size,color,...props}) {
 return <Instance position={position} scale={size} color={color} {...props}/>;
}
function Signal({x,z,axis,time}) {
 const lamps=useRef([]);
 useFrame(()=>{
  const phase=time.current.time%24;
  const green=axis===0?phase<9:phase>=12&&phase<21;
  const amber=axis===0?phase>=9&&phase<12:phase>=21;
  lamps.current.forEach((m,i)=>{if(m){const on=i===0?!green&&!amber:i===1?amber:green;m.emissiveIntensity=on?2.5:0;m.color.set(on?['#ff4747','#ffc64a','#47ff9b'][i]:'#18262c');}});
 });
 return <group position={[x,0,z]} rotation={[0,axis*Math.PI/2,0]}>
  <Box position={[0,2.4,0]} size={[.15,4.8,.15]} color="#343e48"/>
  <Box position={[0,4.5,0]} size={[.7,1.8,.45]} color="#121a23"/>
  {[0,1,2].map(i=><mesh key={i} position={[0,5.05-i*.55,.25]}><sphereGeometry args={[.19,8,8]}/><meshStandardMaterial ref={m=>lamps.current[i]=m} emissive={['#ff2980','#ffb000','#00ff80'][i]}/></mesh>)}
 </group>;
}
const City = memo(function City({sim}) {
 return <Instances castShadow receiveShadow limit={24000} frames={2} frustumCulled={false}><boxGeometry/><meshStandardMaterial roughness={.8}/>
  <Box position={[0,-.4,0]} size={[620,.7,620]} color="#536750"/>
  {STREETS.map(s=><group key={s}>
   <Box position={[s,-.02,0]} size={[16,.12,600]} color="#303943"/>
   <Box position={[0,0,s]} size={[600,.12,16]} color="#303943"/>
   {Array.from({length:119},(_,i)=>i*5-295).filter(v=>roadDistance(v)>10).map(v=><group key={v}>
    <Box position={[s,.07,v]} size={[.13,.025,2.3]} color="#e6d9a2"/>
    <Box position={[v,.08,s]} size={[2.3,.025,.13]} color="#e6d9a2"/>
   </group>)}
  </group>)}
  {STREETS.slice(0,-1).flatMap(x=>STREETS.slice(0,-1).map(z=><Box key={`${x}-${z}`} position={[x+24,.08,z+24]} size={[30,.25,30]} color="#8a929a"/>))}
  {BLOCKS.map((b,i)=><group key={i}>
   <Box position={[b.x,b.h/2+.2,b.z]} size={[b.w,b.h,b.d]} color={b.color}/>
   <Box position={[b.x,b.h+.4,b.z]} size={[b.w+.4,.5,b.d+.4]} color="#263646"/>
   {Array.from({length:Math.floor(b.h/3)},(_,floor)=><group key={floor}>
    <Box position={[b.x,2+floor*3,b.z+b.d/2+.02]} size={[10,1.25,.05]} color={floor%3?'#6d9eac':'#d5caa1'}/>
    <Box position={[b.x-b.w/2-.02,2+floor*3,b.z]} size={[.05,1.25,10]} color="#6d9eac"/>
   </group>)}
  </group>)}
  {STREETS.flatMap(x=>STREETS.map(z=><group key={`${x}-${z}`}>
   <Signal x={x+8} z={z+8} axis={0} time={sim}/><Signal x={x-8} z={z-8} axis={1} time={sim}/>
   {[-1,1].flatMap(side=>Array.from({length:6},(_,i)=><group key={`${side}-${i}`}>
    <Box position={[x-5+i*2,.1,z+side*10]} size={[.85,.025,2]} color="#d6d9d6"/>
    <Box position={[x+side*10,.1,z-5+i*2]} size={[2,.025,.85]} color="#d6d9d6"/>
   </group>))}
  </group>))}
  <Box position={[-298,1,0]} size={[.6,2,596]} color="#d6b56a"/><Box position={[298,1,0]} size={[.6,2,596]} color="#d6b56a"/><Box position={[0,1,298]} size={[596,2,.6]} color="#d6b56a"/><Box position={[-156,1,-298]} size={[284,2,.6]} color="#d6b56a"/><Box position={[156,1,-298]} size={[284,2,.6]} color="#d6b56a"/>
  <Box position={[0,-.4,-1310]} size={[75,.7,2060]} color="#536750"/>
  <Box position={[0,.02,-1300]} size={[24,.14,2040]} color="#303943"/>
  {Array.from({length:200},(_,i)=><group key={'straight-'+i}>
   <Box position={[0,.11,-305-i*10]} size={[.18,.03,5]} color="#ece3b4"/>
   <Box position={[-12.5,.8,-305-i*10]} size={[.4,1.5,10]} color="#b6c1c8"/>
   <Box position={[12.5,.8,-305-i*10]} size={[.4,1.5,10]} color="#b6c1c8"/>
  </group>)}
  <Box position={[0,1,-2315]} size={[26,2,.7]} color="#e3ad64"/>
  <Html position={[0,8,-305]} center distanceFactor={35} occlude><div className="drive-loading">2 KM SPEED STRAIGHT</div></Html>

 </Instances>;
});
function DrivingCar({carId,design,sim,keys,paused,view,orbit,reset,ready,onReady,onHud,traffic,night}) {
 const group=useRef();const [floor,setFloor]=useState(-.7);const motion=useRef({speed:0,steer:0});
 const target=useRef(new Vector3());const desired=useRef(new Vector3());const ticker=useRef(0);const model=carModels[carId];
 const modelReady=useCallback(y=>{setFloor(y);onReady(true);},[onReady]);
 useEffect(()=>{sim.current={...spawn(),...(reset%2?{x:3,z:-305}:{}),time:sim.current.time};},[reset,sim]);
 useFrame(({camera},rawDelta)=>{
  const s=sim.current;const dt=Math.min(rawDelta,.04);const input=keys.current;
  if(!paused&&ready){
   s.time+=dt;
   stepVehicle(s,input,rawDelta,(DRIVE_LIMITS[carId]||300)/3.6,(x,z)=>{
    const straight=Math.abs(x)<10&&z<=-CITY_EDGE&&z>=-2310;
    return (!straight&&(Math.abs(x)>CITY_EDGE+8||Math.abs(z)>CITY_EDGE+8)) ||
     Object.values(traffic.current).some(v=>Math.hypot(x-v.x,z-v.z)<4.4) ||
     BLOCKS.some(b=>Math.abs(x-b.x)<b.w/2+1.3&&Math.abs(z-b.z)<b.d/2+2.1);
   });
   if(!(Math.abs(s.x)<10&&s.z<-CITY_EDGE)&&roadDistance(s.x)>7&&roadDistance(s.z)>7)s.speed*=Math.exp(-dt*2);
  }
  motion.current.speed=paused?0:s.speed;motion.current.steer=s.steer||0;

  if(group.current){group.current.position.set(s.x,-floor+.12,s.z);group.current.rotation.y=s.yaw;group.current.rotation.x+=(clamp(-(s.acceleration||0)*.002,-.035,.035)-group.current.rotation.x)*.12;group.current.rotation.z+=(clamp((s.steer||0)*s.speed*.003,-.045,.045)-group.current.rotation.z)*.1;}
  let offset=view==='Front'?[0,3.5,-10]:view==='Left'?[-10,3,1]:view==='Right'?[10,3,1]:view==='Overhead'?[0,22,1]:[0,4.5,11];
  if(view==='Free'){const angle=orbit.current.yaw,pitch=orbit.current.pitch;offset=[Math.sin(angle)*12*Math.cos(pitch),3+12*Math.sin(pitch),Math.cos(angle)*12*Math.cos(pitch)];}
  const [x,y,z]=offset;
  desired.current.set(s.x+x*Math.cos(s.yaw)+z*Math.sin(s.yaw),y,s.z-x*Math.sin(s.yaw)+z*Math.cos(s.yaw));
  camera.position.lerp(desired.current,1-Math.exp(-dt*6));
  camera.fov+=(60+Math.min(9,Math.abs(s.speed)*.12)-camera.fov)*.03;camera.updateProjectionMatrix();
  target.current.set(s.x,1,s.z);camera.lookAt(target.current);
  ticker.current+=dt;
  if(ticker.current>.1){ticker.current=0;onHud({...s});}
 });
 return <group ref={group}><CarModel modelUrl={model.url} modelRotation={model.rotation||0} customization={design} skip onReady={modelReady} animateWheels motion={motion}/><VehicleLighting floor={floor} night={night} brake={keys.current.has("Space")}/></group>;
}
function initialDesign(carId,location) {
 if(location.state?.design)return normalizeDesign(location.state.design)||normalizeDesign({});
 try{return normalizeDesign(JSON.parse(sessionStorage.getItem(`test-drive:${carId}`)))||normalizeDesign({});}catch{return normalizeDesign({});}
}
function TouchControl({code,label,icon,keys,disabled}) {
 const [pressed,setPressed]=useState(false);
 const pointers=useRef(new Set());
 const release=()=>{pointers.current.clear();keys.current.delete(code);setPressed(false);};
 useEffect(()=>{if(disabled)release();return()=>{keys.current.delete(code);};},[disabled,code,keys]);
 return <button type="button" className={pressed?'is-held':''} disabled={disabled} aria-label={label} onContextMenu={e=>e.preventDefault()}
  onPointerDown={e=>{e.preventDefault();e.stopPropagation();pointers.current.add(e.pointerId);e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(code);setPressed(true);}}
  onPointerUp={e=>{pointers.current.delete(e.pointerId);if(!pointers.current.size)release();}}
  onPointerCancel={release} onLostPointerCapture={e=>{pointers.current.delete(e.pointerId);if(!pointers.current.size)release();}}
  onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();keys.current.add(code);setPressed(true);}}}
  onKeyUp={release} onBlur={release}><Icon name={icon}/><span>{label}</span></button>;
}
export default function TestDrive(){
 const {id}=useParams();const location=useLocation();const carId=Number(id);const car=cars.find(c=>c.id===carId);
 const [night,setNight]=useState(false);
 const [lite,setLite]=useState(()=>matchMedia("(any-pointer: coarse), (max-width: 900px)").matches);
 const [design]=useState(()=>initialDesign(carId,location));const [paused,setPaused]=useState(true);const [ready,setReady]=useState(false);const [view,setView]=useState('Chase');const [reset,setReset]=useState(0);const [hud,setHud]=useState(spawn);const [message,setMessage]=useState('');
 const traffic=useRef({});
 const root=useRef();const sim=useRef(spawn());const keys=useRef(new Set());const orbit=useRef({yaw:0,pitch:.2});const drag=useRef(null);
 useEffect(()=>{try{sessionStorage.setItem(`test-drive:${carId}`,JSON.stringify(design));}catch{}},[carId,design]);
 useEffect(()=>{
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  const stop=()=>{keys.current.clear();setPaused(true);drag.current=null;};
  const down=e=>{if(e.target.closest('button,a,select,input'))return;if(['KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code)){e.preventDefault();keys.current.add(e.code);}if(e.code==='Escape')stop();if(e.code==='KeyC'&&!e.repeat)setView(v=>CAMERAS[(CAMERAS.indexOf(v)+1)%CAMERAS.length]);};
  const up=e=>keys.current.delete(e.code);const hide=()=>{if(document.hidden)stop();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',stop);window.addEventListener('orientationchange',stop);document.addEventListener('visibilitychange',hide);
  return()=>{document.body.style.overflow=previous;keys.current.clear();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',stop);window.removeEventListener('orientationchange',stop);document.removeEventListener('visibilitychange',hide);};
 },[]);
 useEffect(()=>{if(paused)keys.current.clear();},[paused]);
 if(!car||!carModels[carId])return <main className="drive-error"><h1>Choose a car first</h1><Link to="/#collection">Return to collection</Link></main>;
 const resume=()=>{keys.current.clear();setPaused(false);root.current?.focus();};
 const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(root.current.requestFullscreen)await root.current.requestFullscreen();else setMessage('This browser uses the full-page view.');}catch{setMessage('Fullscreen is unavailable; the full-page view is active.');}};

 return <main className="test-drive" ref={root} tabIndex={-1}>
  <DriveBoundary><Canvas shadows={!lite} camera={{position:[3,5,29],fov:60,near:.1,far:550}} dpr={lite?1:[1,1.4]} gl={{antialias:true}} onPointerDown={e=>{if(view==='Free'){drag.current={x:e.clientX,y:e.clientY};e.target.setPointerCapture?.(e.pointerId);}}} onPointerMove={e=>{if(view==='Free'&&drag.current){orbit.current.yaw-=(e.clientX-drag.current.x)*.008;orbit.current.pitch=clamp(orbit.current.pitch+(e.clientY-drag.current.y)*.005,0,1.1);drag.current={x:e.clientX,y:e.clientY};}}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
   <color attach="background" args={['#a5becb']}/><fog attach="fog" args={['#a5becb',190,470]}/><DriveSky night={night} sim={sim} lite={lite}/>
   <City sim={sim}/><CityDetails sim={sim} night={night} lite={lite}/><CityLife sim={sim} traffic={traffic} paused={paused||!ready} lite={lite}/><Suspense fallback={<Html center><div className="drive-loading">Loading your customized car…</div></Html>}>
    <Environment resolution={64}><Lightformer position={[0,8,0]} rotation={[Math.PI/2,0,0]} scale={[15,8,1]} intensity={2}/></Environment>
    <DrivingCar carId={carId} design={design} sim={sim} keys={keys} paused={paused} view={view} orbit={orbit} reset={reset} ready={ready} onReady={setReady} onHud={setHud} traffic={traffic} night={night}/>
   </Suspense>
  </Canvas></DriveBoundary>
  <header className="drive-top"><Link to={`/cars/${carId}#customize-car`} state={{savedDesign:design}}><Icon name="arrow-left"/> Exit drive</Link><div><small>LIMITLESS / CITY DRIVE</small><strong>{car.brand} {car.name}</strong></div><button onClick={fullscreen}>Fullscreen</button></header>
  <aside className="drive-cameras" aria-label="Camera views"><label className="drive-camera-select">Camera<select value={view} onChange={e=>{setView(e.target.value);root.current?.focus();}}>{CAMERAS.map(v=><option key={v}>{v}</option>)}</select></label>{CAMERAS.map(v=><button className="drive-camera-preset" key={v} aria-pressed={view===v} onClick={()=>{setView(v);root.current?.focus();}}>{v}</button>)}<div className="drive-time-toggle" role="group" aria-label="Time of day"><button aria-pressed={!night} onClick={()=>{setNight(false);root.current?.focus();}}>Day</button><button aria-pressed={night} onClick={()=>{setNight(true);root.current?.focus();}}>Night</button></div><button aria-pressed={lite} onClick={()=>{setLite(v=>!v);root.current?.focus();}}>Lite graphics</button></aside>
  <div className="drive-dashboard"><div className="drive-speed"><strong>{Math.round(Math.abs(hud.speed)*3.6)}</strong><span>KM/H · {hud.speed<-.2?'REVERSE':'DRIVE'}</span><small>{(hud.distance/1000).toFixed(2)} km explored</small><small>Peak {Math.round(hud.peak||0)} / {DRIVE_LIMITS[carId]||300} km/h arcade limit</small></div><svg className="drive-map" viewBox="-320 -320 640 640" role="img" aria-label="City map and your position"><rect x="-320" y="-320" width="640" height="640" fill="#111e28"/>{STREETS.map(s=><path key={s} d={`M${s} -304V304M-304 ${s}H304`} stroke="#657984" strokeWidth="10"/>)}<path d="M0 -6 4 5 0 3-4 5Z" fill="#ff6534" transform={`translate(${hud.x},${Math.max(-310,hud.z)}) rotate(${-hud.yaw*180/Math.PI})`}/></svg></div>
  <footer className="drive-bottom"><span>W / S accelerate & reverse · A / D steer · Space brake · C camera · Esc pause</span><button onClick={()=>{setPaused(true);keys.current.clear();}}>Pause</button><button onClick={()=>{setReset(v=>v+2-v%2);keys.current.clear();root.current?.focus();}}>Reset car</button><button onClick={()=>{setReset(v=>v+1+(v%2));keys.current.clear();root.current?.focus();}}>Speed straight</button></footer>
  {view==='Free'&&<p className="drive-free-tip">Drag the scene to look around your car</p>}
  <div className="drive-touch" aria-label="Touch driving controls"><div className="drive-steering"><TouchControl code="KeyA" label="Left" icon="arrow-left" keys={keys} disabled={paused}/><TouchControl code="KeyD" label="Right" icon="arrow-right" keys={keys} disabled={paused}/></div><div className="drive-pedals"><TouchControl code="KeyS" label="Reverse" icon="arrow-down" keys={keys} disabled={paused}/><TouchControl code="Space" label="Brake" icon="pause" keys={keys} disabled={paused}/><TouchControl code="KeyW" label="Go" icon="arrow-up" keys={keys} disabled={paused}/></div></div>
  {hud.hit>0&&<div className="drive-collision" role="status">Contact — reverse to rejoin the road</div>}
  {message&&<p className="drive-message" role="status">{message}</p>}
  {paused&&<div className="drive-pause"><section><p className="eyebrow">YOUR DESIGN. YOUR DRIVE.</p><h1>THE CITY IS YOURS.</h1><p>Explore the expanded city with moving traffic and sidewalk pedestrians. Take the northern road or use Speed straight to reach the 2 km acceleration corridor.</p><p className="drive-touch-help">Hold Go to accelerate and use Left / Right with your other thumb. Hold Brake to slow down; Reverse backs up. Choose Free camera and drag the scene to look around. Landscape gives you a wider view.</p><dl className="drive-keyboard-help"><div><dt>W / S</dt><dd>Accelerate / reverse</dd></div><div><dt>A / D</dt><dd>Steer left / right</dd></div><div><dt>SPACE</dt><dd>Brake</dd></div><div><dt>C / ESC</dt><dd>Camera / pause</dd></div></dl><button disabled={!ready} onClick={resume}>{ready?'Start / resume drive':'Loading your car…'}</button><Link to={`/cars/${carId}#customize-car`} state={{savedDesign:design}}>Back to customization</Link><small>Touch controls are available on phones. Traffic follows city loops and stops for lights. Pedestrians stay on sidewalks. Speed limits are arcade settings, not measured real-world performance.</small></section></div>}
 </main>;
}

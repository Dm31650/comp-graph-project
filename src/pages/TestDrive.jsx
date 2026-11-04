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

const STREETS = [-96, -48, 0, 48, 96];
const CAMERAS = ['Chase', 'Front', 'Left', 'Right', 'Overhead', 'Free'];
const BLOCKS = STREETS.slice(0,-1).flatMap((x,i)=>STREETS.slice(0,-1).flatMap((z,j)=>[-1,1].flatMap((sx)=>[-1,1].map(sz=>({
 x:x+24+sx*8.5,z:z+24+sz*8.5,w:13,d:13,h:8+((i*7+j*3+(sx+sz+2)*2)%6)*5,
 color:['#718093','#53667a','#9b8b80','#496777'][(i+j+(sx+sz+2))%4],
})))));
const spawn = () => ({x:3,z:18,yaw:0,speed:0,distance:0,hit:0,time:0});
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const roadDistance = n => Math.min(...STREETS.map(s=>Math.abs(n-s)));

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
  {[0,1,2].map(i=><mesh key={i} position={[0,5.05-i*.55,.25]}><sphereGeometry args={[.19,8,8]}/><meshStandardMaterial ref={m=>lamps.current[i]=m} emissive={['#ff2020','#ffb000','#00ff80'][i]}/></mesh>)}
 </group>;
}
const City = memo(function City({sim}) {
 return <Instances limit={2500} frames={2} frustumCulled={false}><boxGeometry/><meshStandardMaterial roughness={.8}/>
  <Box position={[0,-.4,0]} size={[240,.7,240]} color="#536750"/>
  {STREETS.map(s=><group key={s}>
   <Box position={[s,-.02,0]} size={[16,.12,224]} color="#303943"/>
   <Box position={[0,0,s]} size={[224,.12,16]} color="#303943"/>
   {Array.from({length:43},(_,i)=>i*5-105).filter(v=>roadDistance(v)>10).map(v=><group key={v}>
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
  {[-106,106].flatMap(edge=>[-1,1].map(axis=><Box key={`${edge}-${axis}`} position={axis===1?[edge,1.1,0]:[0,1.1,edge]} size={axis===1?[.6,2.2,214]:[214,2.2,.6]} color="#d6b56a"/>))}
 </Instances>;
});
function DrivingCar({carId,design,sim,keys,paused,view,orbit,reset,ready,onReady,onHud}) {
 const group=useRef();const [floor,setFloor]=useState(-.7);const [wheelSpeed,setWheelSpeed]=useState(0);
 const target=useRef(new Vector3());const desired=useRef(new Vector3());const ticker=useRef(0);const model=carModels[carId];
 const modelReady=useCallback(y=>{setFloor(y);onReady(true);},[onReady]);
 useEffect(()=>{sim.current=spawn();},[reset,sim]);
 useFrame(({camera},rawDelta)=>{
  const s=sim.current;const dt=Math.min(rawDelta,.04);const input=keys.current;
  if(!paused&&ready){
   s.time+=dt;
   const throttle=(input.has('KeyW')?1:0)-(input.has('KeyS')?1:0);
   const braking=input.has('Space');
   s.speed+=throttle*(s.speed*throttle<0?24:11)*dt;
   const friction=braking?34:throttle?1:4;
   s.speed=Math.sign(s.speed)*Math.max(0,Math.abs(s.speed)-friction*dt);
   s.speed=clamp(s.speed,-10,32);
   const steering=(input.has('KeyA')?1:0)-(input.has('KeyD')?1:0);
   s.yaw+=steering*s.speed/5.2*.48/(1+Math.abs(s.speed)*.04)*dt;
   const nx=s.x-Math.sin(s.yaw)*s.speed*dt,nz=s.z-Math.cos(s.yaw)*s.speed*dt;
   const collision=Math.abs(nx)>103||Math.abs(nz)>103||BLOCKS.some(b=>Math.abs(nx-b.x)<b.w/2+2.5&&Math.abs(nz-b.z)<b.d/2+2.5);
   if(collision){s.speed=-s.speed*.12;s.hit=1;}
   else{s.x=nx;s.z=nz;s.distance+=Math.abs(s.speed)*dt;}
   if(roadDistance(s.x)>7&&roadDistance(s.z)>7)s.speed*=Math.exp(-dt*2);
   s.hit=Math.max(0,s.hit-dt);
  }
  if(group.current){group.current.position.set(s.x,-floor+.12,s.z);group.current.rotation.y=s.yaw;}
  let offset=view==='Front'?[0,3.5,-10]:view==='Left'?[-10,3,1]:view==='Right'?[10,3,1]:view==='Overhead'?[0,22,1]:[0,4.5,11];
  if(view==='Free'){const angle=orbit.current.yaw,pitch=orbit.current.pitch;offset=[Math.sin(angle)*12*Math.cos(pitch),3+12*Math.sin(pitch),Math.cos(angle)*12*Math.cos(pitch)];}
  const [x,y,z]=offset;
  desired.current.set(s.x+x*Math.cos(s.yaw)+z*Math.sin(s.yaw),y,s.z-x*Math.sin(s.yaw)+z*Math.cos(s.yaw));
  camera.position.lerp(desired.current,1-Math.exp(-dt*7));
  target.current.set(s.x,1,s.z);camera.lookAt(target.current);
  ticker.current+=dt;
  if(ticker.current>.1){ticker.current=0;setWheelSpeed(paused?0:s.speed*3.6);onHud({...s});}
 });
 return <group ref={group}><CarModel modelUrl={model.url} modelRotation={model.rotation||0} customization={design} skip onReady={modelReady} driveSpeed={wheelSpeed}/></group>;
}
function initialDesign(carId,location) {
 if(location.state?.design)return normalizeDesign(location.state.design)||normalizeDesign({});
 try{return normalizeDesign(JSON.parse(sessionStorage.getItem(`test-drive:${carId}`)))||normalizeDesign({});}catch{return normalizeDesign({});}
}
export default function TestDrive(){
 const {id}=useParams();const location=useLocation();const carId=Number(id);const car=cars.find(c=>c.id===carId);
 const [design]=useState(()=>initialDesign(carId,location));const [paused,setPaused]=useState(true);const [ready,setReady]=useState(false);const [view,setView]=useState('Chase');const [reset,setReset]=useState(0);const [hud,setHud]=useState(spawn);const [message,setMessage]=useState('');
 const root=useRef();const sim=useRef(spawn());const keys=useRef(new Set());const orbit=useRef({yaw:0,pitch:.2});const drag=useRef(null);
 useEffect(()=>{try{sessionStorage.setItem(`test-drive:${carId}`,JSON.stringify(design));}catch{}},[carId,design]);
 useEffect(()=>{
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  const stop=()=>{keys.current.clear();setPaused(true);drag.current=null;};
  const down=e=>{if(e.target.closest('button,a,select,input'))return;if(['KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code)){e.preventDefault();keys.current.add(e.code);}if(e.code==='Escape')stop();if(e.code==='KeyC'&&!e.repeat)setView(v=>CAMERAS[(CAMERAS.indexOf(v)+1)%CAMERAS.length]);};
  const up=e=>keys.current.delete(e.code);const hide=()=>{if(document.hidden)stop();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',hide);
  return()=>{document.body.style.overflow=previous;keys.current.clear();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hide);};
 },[]);
 useEffect(()=>{if(paused)keys.current.clear();},[paused]);
 if(!car||!carModels[carId])return <main className="drive-error"><h1>Choose a car first</h1><Link to="/#collection">Return to collection</Link></main>;
 const resume=()=>{keys.current.clear();setPaused(false);root.current?.focus();};
 const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(root.current.requestFullscreen)await root.current.requestFullscreen();else setMessage('This browser uses the full-page view.');}catch{setMessage('Fullscreen is unavailable; the full-page view is active.');}};
 const touch=(code,label)=><button aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(code);}} onPointerUp={()=>keys.current.delete(code)} onPointerCancel={()=>keys.current.delete(code)} onLostPointerCapture={()=>keys.current.delete(code)}>{label}</button>;
 return <main className="test-drive" ref={root} tabIndex={-1}>
  <DriveBoundary><Canvas camera={{position:[3,5,29],fov:60,near:.1,far:350}} dpr={[1,1.4]} gl={{antialias:true}} onPointerDown={e=>{if(view==='Free'){drag.current={x:e.clientX,y:e.clientY};e.target.setPointerCapture?.(e.pointerId);}}} onPointerMove={e=>{if(view==='Free'&&drag.current){orbit.current.yaw-=(e.clientX-drag.current.x)*.008;orbit.current.pitch=clamp(orbit.current.pitch+(e.clientY-drag.current.y)*.005,0,1.1);drag.current={x:e.clientX,y:e.clientY};}}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
   <color attach="background" args={['#a5becb']}/><fog attach="fog" args={['#a5becb',100,240]}/><hemisphereLight args={['#e7f2ff','#5e6856',2.2]}/><directionalLight position={[30,70,-40]} intensity={3}/>
   <City sim={sim}/><Suspense fallback={<Html center><div className="drive-loading">Loading your customized car…</div></Html>}>
    <Environment resolution={64}><Lightformer position={[0,8,0]} rotation={[Math.PI/2,0,0]} scale={[15,8,1]} intensity={2}/></Environment>
    <DrivingCar carId={carId} design={design} sim={sim} keys={keys} paused={paused} view={view} orbit={orbit} reset={reset} ready={ready} onReady={setReady} onHud={setHud}/>
   </Suspense>
  </Canvas></DriveBoundary>
  <header className="drive-top"><Link to={`/cars/${carId}#customize-car`} state={{savedDesign:design}}><Icon name="arrow-left"/> Exit drive</Link><div><small>LIMITLESS / CITY DRIVE</small><strong>{car.brand} {car.name}</strong></div><button onClick={fullscreen}>Fullscreen</button></header>
  <aside className="drive-cameras" aria-label="Camera views">{CAMERAS.map(v=><button key={v} aria-pressed={view===v} onClick={()=>{setView(v);root.current?.focus();}}>{v}</button>)}</aside>
  <div className="drive-dashboard"><div className="drive-speed"><strong>{Math.round(Math.abs(hud.speed)*3.6)}</strong><span>KM/H · {hud.speed<-.2?'REVERSE':'DRIVE'}</span><small>{(hud.distance/1000).toFixed(2)} km explored</small></div><svg className="drive-map" viewBox="-115 -115 230 230" role="img" aria-label="City map and your position"><rect x="-115" y="-115" width="230" height="230" fill="#111e28"/>{STREETS.map(s=><path key={s} d={`M${s} -108V108M-108 ${s}H108`} stroke="#657984" strokeWidth="10"/>)}<path d="M0 -6 4 5 0 3-4 5Z" fill="#ff6534" transform={`translate(${hud.x},${hud.z}) rotate(${-hud.yaw*180/Math.PI})`}/></svg></div>
  <footer className="drive-bottom"><span>W / S accelerate & reverse · A / D steer · Space brake · C camera · Esc pause</span><button onClick={()=>{setPaused(true);keys.current.clear();}}>Pause</button><button onClick={()=>{setReset(v=>v+1);keys.current.clear();root.current?.focus();}}>Reset car</button></footer>
  {view==='Free'&&<p className="drive-free-tip">Drag the scene to look around your car</p>}
  <div className="drive-touch" aria-label="Touch driving controls"><div>{touch('KeyA','Left')}{touch('KeyD','Right')}</div><div>{touch('KeyW','Accelerate')}{touch('KeyS','Reverse')}{touch('Space','Brake')}</div></div>
  {hud.hit>0&&<div className="drive-collision" role="status">Collision — slow down or reverse</div>}
  {message&&<p className="drive-message" role="status">{message}</p>}
  {paused&&<div className="drive-pause"><section><p className="eyebrow">YOUR DESIGN. YOUR DRIVE.</p><h1>THE CITY IS YOURS.</h1><p>Explore a compact city with intersections, buildings, crossings and working traffic signals. This is an arcade driving sandbox.</p><dl><div><dt>W / S</dt><dd>Accelerate / reverse</dd></div><div><dt>A / D</dt><dd>Steer left / right</dd></div><div><dt>SPACE</dt><dd>Brake</dd></div><div><dt>C / ESC</dt><dd>Camera / pause</dd></div></dl><button disabled={!ready} onClick={resume}>{ready?'Start / resume drive':'Loading your car…'}</button><Link to={`/cars/${carId}#customize-car`} state={{savedDesign:design}}>Back to customization</Link><small>Touch controls are available on phones. Traffic lights cycle automatically; there are no AI traffic vehicles or pedestrians yet.</small></section></div>}
 </main>;
}


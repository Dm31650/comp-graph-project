import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CurvePath, LineCurve3, QuadraticBezierCurve3, Vector3 } from 'three';
import CarModel from '../components/CarModel';
import { carModels } from '../data/carModels';
import { STREETS, CITY_EDGE } from './cityLayout';

function route(extent) {
 const e=extent-3,r=5;
 const path=new CurvePath();
 const pts=[[-e,e-r],[-e,-e+r],[-e+r,-e],[e-r,-e],[e,-e+r],[e,e-r],[e-r,e],[-e+r,e]];
 const vector=([x,z])=>new Vector3(x,0,z);
 const corners=[[-e,-e],[e,-e],[e,e],[-e,e]];
 for(let i=0;i<8;i++)path.add(i%2?new QuadraticBezierCurve3(vector(pts[i]),vector(corners[(i-1)/2]),vector(pts[(i+1)%8])):new LineCurve3(vector(pts[i]),vector(pts[i+1])));
 return path;
}
function TrafficCar({index,sim,traffic,paused}) {
 const group=useRef(),motion=useRef({speed:0,steer:0});const [floor,setFloor]=useState(-.7);const ready=useCallback(y=>setFloor(y),[]);
 const path=useMemo(()=>route(48+(index%5)*48),[index]);const length=useMemo(()=>path.getLength(),[path]);
 const state=useRef({progress:(index*.137+.13)%1,speed:0});
 const point=useRef(new Vector3()),tangent=useRef(new Vector3()),next=useRef(new Vector3());
 const model=carModels[[2,4][index%2]];
 useEffect(()=>()=>{delete traffic.current[index];},[index,traffic]);
 useFrame((_,delta)=>{
  const dt=Math.min(delta,.05),s=state.current;
  path.getPointAt(s.progress,point.current);path.getTangentAt(s.progress,tangent.current);
  const {x,z}=point.current,dx=tangent.current.x,dz=tangent.current.z,axis=Math.abs(dx)>.8?1:0;
  const phase=sim.current.time%24,green=axis===0?phase<9:phase>=12&&phase<21;
  const coordinate=axis?x:z,direction=axis?dx:dz;
  const gap=Math.min(...STREETS.map(r=>(r-coordinate)*Math.sign(direction)).filter(v=>v>8));
  const red=!green&&gap<20;
  const ahead=(ox,oz)=>{const along=(ox-x)*dx+(oz-z)*dz;return along>0&&along<14&&Math.abs((ox-x)*dz-(oz-z)*dx)<3;};
  const blocked=ahead(sim.current.x,sim.current.z)||Object.entries(traffic.current).some(([key,v])=>Number(key)!==index&&ahead(v.x,v.z));
  const desired=paused||blocked?0:red?Math.min(8,Math.max(0,(gap-10)*.7)):7+index%4;
  s.speed+=(desired-s.speed)*(1-Math.exp(-dt*(desired<s.speed?5:1.5)));
  if(!paused)s.progress=(s.progress+s.speed*dt/length)%1;
  path.getPointAt(s.progress,point.current);path.getTangentAt(s.progress,tangent.current);
  path.getTangentAt((s.progress+.002)%1,next.current);
  const yaw=Math.atan2(-tangent.current.x,-tangent.current.z),future=Math.atan2(-next.current.x,-next.current.z);
  motion.current.speed=paused?0:s.speed;motion.current.steer=Math.max(-.4,Math.min(.4,Math.atan2(Math.sin(future-yaw),Math.cos(future-yaw))*8));
  if(group.current){group.current.position.set(point.current.x,-floor+.08,point.current.z);group.current.rotation.y=yaw;}
  traffic.current[index]={x:point.current.x,z:point.current.z};
 });
 return <group ref={group}><CarModel modelUrl={model.url} modelRotation={model.rotation||0} skip onReady={ready} animateWheels motion={motion}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,.065,0]}><planeGeometry args={[2.2,5]}/><meshBasicMaterial color="#10151b" transparent opacity={.22} depthWrite={false}/></mesh></group>;
}
function Walker({index,sim}) {
 const group=useRef(),legs=useRef([]),arms=useRef([]);
 const bx=-CITY_EDGE+24+(index%12)*48,bz=-CITY_EDGE+24+(Math.floor(index/12)%12)*48;
 useFrame(()=>{
  const distance=(sim.current.time*(.85+index%4*.1)+index*8)%116,side=Math.floor(distance/29),t=distance%29;
  const positions=[[-14.5+t,14.5],[14.5,14.5-t],[14.5-t,-14.5],[-14.5,-14.5+t]];
  if(group.current){group.current.position.set(bx+positions[side][0],.22,bz+positions[side][1]);group.current.rotation.y=[Math.PI/2,Math.PI,-Math.PI/2,0][side];}
  const swing=Math.sin(sim.current.time*5.8+index)*.32;
  legs.current.forEach((part,i)=>{if(part)part.rotation.x=i?swing:-swing;});arms.current.forEach((part,i)=>{if(part)part.rotation.x=i?-swing:swing;});
 });
 const skin=['#b77d58','#d7a17e','#704b38','#ebc1a1'][index%4];
 return <group ref={group} scale={.94+index%3*.06}>
  <mesh position={[0,1.58,0]}><sphereGeometry args={[.16,8,8]}/><meshStandardMaterial color={skin}/></mesh>
  <mesh position={[0,1.71,-.015]}><sphereGeometry args={[.155,8,6,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={index%3?'#302923':'#a2825f'}/></mesh>
  <mesh position={[0,1.12,0]}><capsuleGeometry args={[.19,.37,3,8]}/><meshStandardMaterial color={['#c77750','#40728a','#c6ae6c','#756b8a','#546f5e'][index%5]}/></mesh>
  <mesh position={[0,1.16,.16]}><boxGeometry args={[.26,.32,.13]}/><meshStandardMaterial color="#37444a"/></mesh>
  {[-1,1].map((side,i)=><group key={side}>
   <group position={[side*.11,.84,0]} ref={el=>legs.current[i]=el}><mesh position={[0,-.32,0]}><capsuleGeometry args={[.075,.48,2,6]}/><meshStandardMaterial color="#2e3c4b"/></mesh><mesh position={[0,-.64,-.05]}><boxGeometry args={[.15,.12,.27]}/><meshStandardMaterial color="#23272a"/></mesh></group>
   <group position={[side*.25,1.38,0]} ref={el=>arms.current[i]=el}><mesh position={[0,-.24,0]}><capsuleGeometry args={[.06,.36,2,6]}/><meshStandardMaterial color={skin}/></mesh></group>
  </group>)}
 </group>;
}
export default memo(function CityLife({sim,traffic,paused,lite}) {
 return <>{Array.from({length:lite?4:10},(_,i)=><Suspense key={i} fallback={null}><TrafficCar index={i} sim={sim} traffic={traffic} paused={paused} lite={lite}/></Suspense>)}{Array.from({length:lite?24:72},(_,i)=><Walker key={i} index={i*2} sim={sim}/>)}</>;
});

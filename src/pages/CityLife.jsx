import { memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import CarModel from '../components/CarModel';
import { carModels } from '../data/carModels';

const roads = [-192,-144,-96,-48,0,48,96,144,192];
function TrafficCar({ index, sim, traffic, paused, lite }) {
 const group=useRef();const [floor,setFloor]=useState(-.7);const ready=useCallback(y=>setFloor(y),[]);
 const extent=48+(index%3)*48;
 const corners=[[-extent+3,extent-3],[-extent+3,-extent+3],[extent-3,-extent+3],[extent-3,extent-3]];
 const state=useRef({segment:index%4,t:.15+(index%2)*.45});
 const model=carModels[(lite?[2,4]:[2,4,6])[index%(lite?2:3)]];
 useEffect(()=>()=>{delete traffic.current[index];},[index,traffic]);
 useFrame((_,delta)=>{
  const s=state.current,a=corners[s.segment],b=corners[(s.segment+1)%4];
  let x=a[0]+(b[0]-a[0])*s.t,z=a[1]+(b[1]-a[1])*s.t;
  const dx=Math.sign(b[0]-a[0]),dz=Math.sign(b[1]-a[1]);const axis=dx?1:0;
  const phase=sim.current.time%24;const green=axis===0?phase<9:phase>=12&&phase<21;
  const coordinate=axis?x:z;const direction=axis?dx:dz;
  const approaching=roads.some(r=>{const gap=(r-coordinate)*direction;return gap>9&&gap<14;});
  const ahead=(ox,oz)=>{const distance=(ox-x)*dx+(oz-z)*dz;return distance>0&&distance<10&&Math.abs((ox-x)*dz-(oz-z)*dx)<3;};
  const blocked=ahead(sim.current.x,sim.current.z)||Object.entries(traffic.current).some(([key,v])=>Number(key)!==index&&ahead(v.x,v.z));
  if(!paused&&!(approaching&&!green)&&!blocked){s.t+=Math.min(delta,.04)*(7+index*.4)/(extent*2-6);if(s.t>=1){s.t=0;s.segment=(s.segment+1)%4;}}
  const yaw=Math.atan2(-dx,-dz);
  if(group.current){group.current.position.set(x,-floor+.12,z);group.current.rotation.y=yaw;}
  traffic.current[index]={x,z};
 });
 return <group ref={group}><CarModel modelUrl={model.url} modelRotation={model.rotation||0} skip onReady={ready}/></group>;
}
function Walker({index,sim}) {
 const group=useRef(),legs=useRef([]),arms=useRef([]);
 const bx=-168+(index%8)*48,bz=-168+Math.floor(index/8)*96;
 useFrame(()=>{
  const distance=(sim.current.time*1.15+index*5)%116,side=Math.floor(distance/29),t=distance%29;
  const positions=[[-14.5+t,14.5],[14.5,14.5-t],[14.5-t,-14.5],[-14.5,-14.5+t]];
  if(group.current){group.current.position.set(bx+positions[side][0],.22,bz+positions[side][1]);group.current.rotation.y=[Math.PI/2,Math.PI, -Math.PI/2,0][side];}
  const swing=Math.sin(sim.current.time*7+index)*.45;
  legs.current.forEach((part,i)=>{if(part)part.rotation.x=i?swing:-swing;});
  arms.current.forEach((part,i)=>{if(part)part.rotation.x=i?-swing:swing;});
 });
 return <group ref={group}>
  <mesh position={[0,1.55,0]}><sphereGeometry args={[.17,8,6]}/><meshStandardMaterial color={index%2?'#b77d58':'#d7a17e'}/></mesh>
  <mesh position={[0,1.12,0]}><boxGeometry args={[.42,.58,.25]}/><meshStandardMaterial color={['#d16d47','#3c819c','#d3b65a','#6e658f'][index%4]}/></mesh>
  {[-1,1].map((side,i)=><group key={side}>
   <group position={[side*.12,.84,0]} ref={el=>legs.current[i]=el}><mesh position={[0,-.36,0]}><boxGeometry args={[.16,.72,.18]}/><meshStandardMaterial color="#263345"/></mesh></group>
   <group position={[side*.29,1.35,0]} ref={el=>arms.current[i]=el}><mesh position={[0,-.27,0]}><boxGeometry args={[.13,.55,.15]}/><meshStandardMaterial color="#b77d58"/></mesh></group>
  </group>)}
 </group>;
}
export default memo(function CityLife({sim,traffic,paused,lite}) {
 return <>{Array.from({length:lite?3:6},(_,i)=><Suspense key={i} fallback={null}><TrafficCar index={i} sim={sim} traffic={traffic} paused={paused} lite={lite}/></Suspense>)}{Array.from({length:lite?12:24},(_,i)=><Walker key={i} index={i} sim={sim}/>)}</>;
});


import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, BufferAttribute, CanvasTexture, RepeatWrapping } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BLOCKS, PARKS, STREETS } from './cityLayout';

function merged(items) {
 const parts=items.map(({p,s,c})=>{
  const g=new BoxGeometry(...s).translate(...p);const color=new Float32Array(g.attributes.position.count*3);
  const rgb=c||[.38,.43,.45];for(let i=0;i<color.length;i+=3)color.set(rgb,i);g.setAttribute('color',new BufferAttribute(color,3));return g;
 });
 const result=mergeGeometries(parts);parts.forEach(g=>g.dispose());return result;
}
function asphaltTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const context=canvas.getContext('2d');const image=context.createImageData(128,128);
 for(let i=0;i<image.data.length;i+=4){const n=105+((i*1103515245>>>8)%35);image.data.set([n,n,n,255],i);}
 context.putImageData(image,0,0);const texture=new CanvasTexture(canvas);texture.wrapS=texture.wrapT=RepeatWrapping;texture.repeat.set(150,150);return texture;
}
export default memo(function CityDetails({night,lite}) {
 const lamps=useRef();
 const road=useMemo(()=>asphaltTexture(),[]);
 const streetFurniture=useMemo(()=>merged(STREETS.slice(0,-1).flatMap((x,i)=>STREETS.slice(0,-1).flatMap((z,j)=>[
  {p:[x+10,3.3,z+24],s:[.16,6.6,.16],c:[.15,.18,.2]},
  {p:[x+11.2,6.6,z+24],s:[2.5,.15,.18],c:[.15,.18,.2]},
  {p:[x+24,.38,z+8.2],s:[30,.6,.35],c:[.52,.54,.52]},
  {p:[x+8.2,.38,z+24],s:[.35,.6,30],c:[.52,.54,.52]},
  {p:[x+11,.8,z+15],s:[.5,1.6,1.2],c:[.2,.26,.28]},
  ...((i+j)%3===0?[{p:[x+15,.6,z+10],s:[3,.3,.8],c:[.42,.25,.14]},{p:[x+15,.4,z+10],s:[.2,.8,.8],c:[.15,.18,.2]}]:[]),
  ...(!PARKS.some(p=>p.x===x+24&&p.z===z+24)?[{p:[x+15.5,2,z+9.94],s:[9,1,.1],c:[.14,.34,.32]},{p:[x+15.5,1,z+9.9],s:[5,2,.1],c:[.23,.36,.4]}]:[])
 ]))),[]);
 const glow=useMemo(()=>merged(STREETS.slice(0,-1).flatMap(x=>STREETS.slice(0,-1).map(z=>({p:[x+12.2,6.5,z+24],s:[.9,.1,.5]})))),[]);
 const asphalt=useMemo(()=>merged(STREETS.flatMap(s=>[{p:[s,.064,0],s:[16,.002,600]},{p:[0,.067,s],s:[600,.002,16]}])),[]);
 const trees=useMemo(()=>PARKS.flatMap(p=>[-9,0,9].flatMap(x=>[-9,9].map(z=>[p.x+x,p.z+z]))),[]);
 const verticals=useMemo(()=>merged(BLOCKS.flatMap(b=>[-1,1].flatMap(side=>[
 {p:[b.x+side*3.7,b.h/2,b.z+b.d/2+.06],s:[.15,b.h,.08],c:[.28,.33,.35]},
 {p:[b.x-b.w/2-.06,b.h/2,b.z+side*3.7],s:[.08,b.h,.15],c:[.28,.33,.35]}]))),[]);
 useFrame((_,delta)=>{if(lamps.current)lamps.current.emissiveIntensity+=(Number(night)*3-lamps.current.emissiveIntensity)*(1-Math.exp(-delta));});
 return <>
  <mesh geometry={streetFurniture} castShadow={!lite} receiveShadow><meshStandardMaterial vertexColors roughness={.85}/></mesh>
  <mesh geometry={verticals}><meshStandardMaterial vertexColors metalness={.25} roughness={.55}/></mesh>
  <mesh geometry={glow}><meshStandardMaterial ref={lamps} color="#ffe4b4" emissive="#ffcd80" emissiveIntensity={0}/></mesh>
  <mesh geometry={asphalt} receiveShadow><meshStandardMaterial map={road} color="#596063" roughness={.96}/></mesh>
  {PARKS.map((p,i)=><mesh key={i} position={[p.x,.23,p.z]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[29,29]}/><meshStandardMaterial color="#446c4b" roughness={1}/></mesh>)}
  {trees.filter((_,i)=>!lite||i%2===0).map(([x,z],i)=><group key={i} position={[x,.3,z]}><mesh position={[0,1.5,0]}><cylinderGeometry args={[.18,.3,3,6]}/><meshStandardMaterial color="#69503b"/></mesh><mesh position={[0,4,0]} castShadow={!lite}><icosahedronGeometry args={[2.1,1]}/><meshStandardMaterial color={i%2?'#396342':'#507b4b'}/></mesh></group>)}
  <group position={[0,0,-315]}><mesh position={[-10,6,0]}><boxGeometry args={[.4,12,.4]}/><meshStandardMaterial color="#61696d"/></mesh><mesh position={[10,6,0]}><boxGeometry args={[.4,12,.4]}/><meshStandardMaterial color="#61696d"/></mesh><mesh position={[0,10.4,0]}><boxGeometry args={[22,2,.3]}/><meshStandardMaterial color="#1b4c48"/></mesh></group>
 </>;
});

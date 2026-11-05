import { useEffect, useMemo, useRef } from 'react';
import { CanvasTexture } from 'three';
export default function VehicleLighting({floor,night,brake}) {
 const left=useRef(),right=useRef();
 const shadow=useMemo(()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d');
  const g=ctx.createRadialGradient(32,32,6,32,32,32);g.addColorStop(0,'rgba(0,0,0,.65)');g.addColorStop(.5,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new CanvasTexture(canvas);
 },[]);
 useEffect(()=>{if(left.current&&right.current){left.current.target=left.current.children[0];right.current.target=right.current.children[0];}},[]);
 useEffect(()=>()=>shadow.dispose(),[shadow]);
 return <>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,floor+.015,0]}><planeGeometry args={[3.2,6.2]}/><meshBasicMaterial map={shadow} transparent opacity={.75} depthWrite={false}/></mesh>
  {[-.72,.72].map((x,i)=><group key={x}>
   <spotLight ref={i?right:left} position={[x,floor+.55,-2.2]} intensity={night?55:0} color="#edf4ff" angle={.42} penumbra={.6} distance={55} decay={1.3}><object3D position={[0,-1,-25]}/></spotLight>
   <mesh position={[x,floor+.5,2.5]}><boxGeometry args={[.4,.07,.035]}/><meshBasicMaterial color={brake?'#ff2536':night?'#b9202b':'#631f27'} toneMapped={false}/></mesh>
  </group>)}
 </>;
}

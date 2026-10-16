import { Component, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

class VisualBoundary extends Component {
 state = { failed: false };
 static getDerivedStateFromError() { return { failed: true }; }
 render() { return this.state.failed ? <div className="driver-fallback">YOUR DRIVE. YOUR SIGNATURE.</div> : this.props.children; }
}
function Wheel({ color, animate }) {
 const wheel = useRef();
 useFrame((_, delta) => { if (animate && wheel.current) wheel.current.rotation.z -= Math.min(delta, .05) * .25; });
 return <group ref={wheel} rotation={[0.12, -.3, 0]}>
  <mesh><torusGeometry args={[1.65, .32, 24, 80]}/><meshStandardMaterial color="#15171c" roughness={.8}/></mesh>
  <mesh><torusGeometry args={[1.35, .07, 16, 80]}/><meshStandardMaterial color={color} metalness={.8} roughness={.22}/></mesh>
  <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.3,.3,.3,32]}/><meshStandardMaterial color={color} metalness={.7} roughness={.25}/></mesh>
  {Array.from({length:10},(_,i) => <group key={i} rotation={[0,0,i*Math.PI/5]}><mesh position={[0,.8,0]} rotation={[0,0,.15]}><boxGeometry args={[.1,1.1,.18]}/><meshStandardMaterial color={color} metalness={.8} roughness={.22}/></mesh></group>)}
 </group>;
}
export default function DriverSculpture({ color = '#ff6534' }) {
 const [motion, setMotion] = useState(false);
 useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'); const change = () => setMotion(!media.matches); change(); media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
 return <div className="driver-visual"><VisualBoundary><Canvas camera={{position:[0,0,6],fov:45}} dpr={[1,1.5]} fallback={<div>YOUR DRIVE. YOUR SIGNATURE.</div>}><ambientLight intensity={1}/><directionalLight position={[3,4,5]} intensity={4}/><pointLight position={[-3,0,2]} color={color} intensity={12}/><Wheel color={color} animate={motion}/><OrbitControls enableZoom={false} enablePan={false}/></Canvas></VisualBoundary><div className="driver-visual-caption"><span>YOUR SIGNATURE / IN MOTION</span><p>Drag to explore your forged wheel.</p><button type="button" onClick={() => setMotion(!motion)}>{motion ? 'Pause rotation' : 'Rotate wheel'}</button></div></div>;
}

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';

const DAY = new Color('#a5becb');
const DUSK = new Color('#b76558');
const NIGHT = new Color('#080f27');
const SUN = new Color('#fff0bc');
const SUNSET = new Color('#ff7548');

export default function DriveSky({ night }) {
  const sun = useRef(), moon = useRef(), stars = useRef();
  const daylight = useRef(), moonlight = useRef(), ambient = useRef();
  const windows = useRef();
  const progress = useRef(0);
  const transition = useRef({ from: 0, to: 0, elapsed: 0 });
  const reduced = useRef(false);
  const colors = useMemo(() => ({ sky: new Color(), sun: new Color() }), []);
  const starPositions = useMemo(() => {
    const values = [];
    for (let i = 0; i < 240; i++) {
      const angle = i * 2.399963;
      const height = .12 + ((i * 37 % 239) / 239) * .86;
      const ring = Math.sqrt(1 - height * height) * 190;
      values.push(Math.cos(angle) * ring, height * 190, Math.sin(angle) * ring);
    }
    return new Float32Array(values);
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { reduced.current = media.matches; };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    transition.current = { from: progress.current, to: night ? 1 : 0, elapsed: 0 };
  }, [night]);
  useFrame(({ scene, camera }, delta) => {
    const travel = transition.current;
    travel.elapsed = Math.min(6, travel.elapsed + Math.min(delta, .05));
    const t = reduced.current ? 1 : travel.elapsed / 6;
    const smooth = t * t * (3 - 2 * t);
    const p = progress.current = travel.from + (travel.to - travel.from) * smooth;
    const twilight = Math.sin(p * Math.PI);
    colors.sky.copy(DAY).lerp(NIGHT, p).lerp(DUSK, twilight * .65);
    scene.background.copy(colors.sky);
    if (scene.fog) scene.fog.color.copy(colors.sky);
    // Match reflections to the changing sky without rebuilding the environment map.
    scene.environmentIntensity = 1 - p * .72;
    const sunAngle = .65 - p * .95;
    const moonAngle = -.3 + p * .95;
    sun.current.position.set(camera.position.x + 50, Math.sin(sunAngle) * 165, camera.position.z - Math.cos(sunAngle) * 165);
    moon.current.position.set(camera.position.x - 65, Math.sin(moonAngle) * 165, camera.position.z - Math.cos(moonAngle) * 165);
    sun.current.material.color.copy(colors.sun.copy(SUN).lerp(SUNSET, p));
    sun.current.material.opacity = Math.max(0, 1 - p * 1.6);
    moon.current.material.opacity = Math.max(0, (p - .35) / .65);
    stars.current.position.copy(camera.position);
    stars.current.material.opacity = Math.max(0, (p - .45) / .55);
    daylight.current.position.set(50, Math.max(2, Math.sin(sunAngle) * 165), -100);
    daylight.current.color.copy(colors.sun);
    daylight.current.intensity = 3 * (1 - p);
    moonlight.current.intensity = p * 1.2;
    ambient.current.intensity = 2.2 - p * 1.65;
    windows.current.emissiveIntensity = p * 1.8;
    windows.current.opacity = p * .85;
  });
  return <>
    <hemisphereLight ref={ambient} args={['#e7f2ff', '#5e6856', 2.2]} />
    <directionalLight ref={daylight} position={[30,70,-40]} intensity={3} />
    <directionalLight ref={moonlight} position={[-65,90,-100]} color="#91b7ff" intensity={0} />
    <mesh ref={sun} renderOrder={1}><sphereGeometry args={[9,24,16]}/><meshBasicMaterial color="#fff0bc" fog={false} transparent depthWrite={false} toneMapped={false}/></mesh>
    <mesh ref={moon} renderOrder={1}><sphereGeometry args={[6,24,16]}/><meshBasicMaterial color="#dbe8ff" fog={false} transparent opacity={0} depthWrite={false} toneMapped={false}/></mesh>
    <points ref={stars}><bufferGeometry><bufferAttribute attach="attributes-position" args={[starPositions,3]}/></bufferGeometry><pointsMaterial size={.55} color="#cbdcff" transparent opacity={0} fog={false} depthWrite={false} toneMapped={false}/></points>
    {/* A single merged geometry keeps illuminated window strips inexpensive. */}
    <mesh geometry={useMemo(() => buildWindows(), [])}><meshStandardMaterial ref={windows} color="#e8c889" emissive="#ffcf80" emissiveIntensity={0} transparent opacity={0} depthWrite={false}/></mesh>
  </>;
}

import { BoxGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
function buildWindows() {
  const parts = [];
  const streets = [-192,-144,-96,-48,0,48,96,144];
  streets.forEach((x,i) => streets.forEach((z,j) => [-1,1].forEach(sx => [-1,1].forEach(sz => {
    const bx=x+24+sx*8.5, bz=z+24+sz*8.5;
    const height=8+((i*7+j*3+(sx+sz+2)*2)%6)*5;
    for(let f=0;f<Math.floor(height/3);f++) {
      parts.push(new BoxGeometry(10,1.25,.025).translate(bx,2+f*3,bz+5.55));
      parts.push(new BoxGeometry(.025,1.25,10).translate(bx-5.55,2+f*3,bz));
    }
  }))));
  const geometry = mergeGeometries(parts);
  parts.forEach(part=>part.dispose());
  return geometry;
}


import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./InteractiveBackground.css";

export default function InteractiveBackground() {
  const host = useRef(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const needsRender = useRef(true);
  useEffect(() => { pausedRef.current = paused; needsRender.current = true; }, [paused]);

  useEffect(() => {
    const container = host.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.matchMedia("(max-width: 768px)");
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch { return; } // The CSS studio glow remains available without WebGL.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small.matches ? 1 : 1.25));
    renderer.setClearColor(0x08090b, 0);
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08090b, 0.035);
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 150);
    camera.position.set(0, 1.4, 10);
    const world = new THREE.Group();
    scene.add(world);
    const resources = [];
    const keep = (resource) => { resources.push(resource); return resource; };
    const orange = keep(new THREE.LineBasicMaterial({ color: 0xff6534, transparent: true, opacity: 0.26 }));
    const dim = keep(new THREE.LineBasicMaterial({ color: 0x647180, transparent: true, opacity: 0.16 }));
    const hot = keep(new THREE.LineBasicMaterial({ color: 0xff9869, transparent: true, opacity: 0.58 }));
    const line = (points, material, parent = world) => {
      const geometry = keep(new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p))));
      const object = new THREE.Line(geometry, material); parent.add(object); return object;
    };
    // Architectural frames suggest a wind tunnel around a low track horizon.
    const frames = [];
    for (let index = 0; index < 15; index++) {
      const frame = line([[-12,-3,0],[-12,7,0],[-7,11,0],[7,11,0],[12,7,0],[12,-3,0]], index % 3 === 0 ? orange : dim);
      frame.position.z = -index * 7;
      frames.push(frame);
    }
    for (let x = -18; x <= 18; x += 2) line([[x,-3,12],[x,-3,-110]], Math.abs(x) === 6 ? orange : dim);
    const roadLines = [];
    for (let index = 0; index < 24; index++) {
      const roadLine = line([[-18,-3,0],[18,-3,0]], dim);
      roadLine.position.z = -index * 5;
      roadLines.push(roadLine);
    }
    const trails = [];
    for (let index = 0; index < (small.matches ? 12 : 24); index++) {
      const side = index % 2 === 0 ? -1 : 1;
      const trail = line([[0,0,0],[0,0,-3 - index % 5]], index % 4 === 0 ? hot : orange);
      trail.position.set(side * (7 + index % 5 * 1.15), -2.5 + index % 6 * 1.4, -index * 4);
      trails.push({object:trail, speed:6 + index % 4 * 2});
    }
    const pointer = new THREE.Vector2();
    let scroll = 0;
    let active = !document.hidden;
    let reduced = motion.matches;
    let frameId = 0;
    let previous = 0;
    let elapsed = 0;
    const resize = () => {
      needsRender.current = true;
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const move = event => {
      if (event.pointerType === "touch") return;
      pointer.set(event.clientX / window.innerWidth * 2 - 1, event.clientY / window.innerHeight * 2 - 1);
    };
    const resetPointer = () => pointer.set(0, 0);
    const updateScroll = () => { scroll = Math.min(1, window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)); };
    const updateMotion = () => {reduced = motion.matches; needsRender.current = true;};
    const render = (timestamp) => {
      frameId = requestAnimationFrame(render);
      if (!active || timestamp - previous < 1000 / 30) return;
      if ((reduced || pausedRef.current) && !needsRender.current) { previous = timestamp; return; }
      const delta = previous ? Math.min((timestamp - previous) / 1000, 0.06) : 0;
      previous = timestamp;
      if (!reduced && !pausedRef.current) {
        elapsed += delta;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.9, 2.4, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.4 - pointer.y * 0.45 + scroll * 0.5, 2.4, delta);
        world.rotation.z = THREE.MathUtils.damp(world.rotation.z, -pointer.x * 0.018, 2.4, delta);
        frames.forEach((frame, index) => {frame.position.z = ((elapsed * 1.8 + index * 7) % 105) - 95;});
        roadLines.forEach((roadLine, index) => {roadLine.position.z = ((elapsed * 2.8 + index * 5) % 120) - 110;});
        trails.forEach(({object, speed}) => {object.position.z += delta * speed; if (object.position.z > 12) object.position.z = -100;});
      }
      camera.lookAt(0, 0.7, -28);
      renderer.render(scene, camera);
      needsRender.current = false;
    };
    const visibility = () => {active = !document.hidden; previous = 0; needsRender.current = true;};
    const contextLost = event => {event.preventDefault(); active = false; renderer.domElement.style.opacity = "0";};
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, {passive:true});
    window.addEventListener("blur", resetPointer);
    window.addEventListener("scroll", updateScroll, {passive:true});
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", updateMotion);
    resize(); updateScroll(); frameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", resetPointer);
      window.removeEventListener("scroll", updateScroll);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", updateMotion);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      resources.forEach(resource => resource.dispose());
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <><div ref={host} className="interactive-background" aria-hidden="true"/><button className="background-motion-control" type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}><span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span> {paused ? "Resume background" : "Pause background"}</button></>;
}

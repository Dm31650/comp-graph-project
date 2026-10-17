import Icon from './Icon';
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { Component, Suspense, useEffect, useState } from "react";
import CarModel from "./CarModel";
import "./CarViewer.css";

const studios = {
  Daylight: { ambient: 0.7, key: "#ffffff", fill: "#dbeaff", accent: "#ff6534", keyPower: 3, accentPower: 20, strip: "#ffffff" },
  Warm: { ambient: 0.52, key: "#ffd1a1", fill: "#ff9c67", accent: "#ff6b38", keyPower: 3.3, accentPower: 26, strip: "#ffc18a" },
  Track: { ambient: 0.34, key: "#d5e6ff", fill: "#4d76c8", accent: "#4c8fff", keyPower: 3.6, accentPower: 30, strip: "#75a7ff" },
};

class ViewerBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <div className="assembly-fallback">The 3D preview couldn’t load. You can still explore the collection below.</div>
      : this.props.children;
  }
}

function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const distance = size.width < 600 ? 10 : 9;
    camera.position.set(-distance * 0.65, distance * 0.32, -distance * 0.85);
    camera.lookAt(0, 0.2, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

export default function CarViewer({ modelUrl = "/models/porsche/scene.gltf", modelName = "Porsche", modelRotation = 0, customization, onPartSelect, studio = "Daylight" }) {
  const [progress, setProgress] = useState(0);
  const [floorY, setFloorY] = useState(null);
  const [run, setRun] = useState(0);
  const [skip, setSkip] = useState(Boolean(customization));
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const lighting = studios[studio] || studios.Daylight;
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const ready = floorY !== null;
  const complete = progress === 100;
  return (
    <div className="assembly-viewer">
      <ViewerBoundary>
        <Canvas camera={{ position: [-7, 3.5, -9], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <ResponsiveCamera />
          <ambientLight intensity={lighting.ambient} />
          <directionalLight position={[5, 10, 5]} intensity={lighting.keyPower} color={lighting.key} />
          <directionalLight position={[-5, 4, -5]} intensity={2} color={lighting.fill} />
          <pointLight position={[-4, 3, 3]} intensity={lighting.accentPower} color={lighting.accent} />
          <Suspense fallback={null}>
            <CarModel modelUrl={modelUrl} modelRotation={modelRotation} run={run} skip={skip} reducedMotion={reducedMotion} onProgress={setProgress} onReady={setFloorY} customization={customization} onPartSelect={onPartSelect} />
            {/* Local studio reflections: no external HDR download required. */}
            <Environment resolution={128}>
              <Lightformer position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 4, 1]} intensity={3} color={lighting.strip} />
              <Lightformer position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} intensity={2} color={lighting.fill} />
              <Lightformer position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 3, 1]} intensity={2} color={lighting.key} />
            </Environment>
            {ready && <ContactShadows position={[0, floorY - 0.025, 0]} opacity={0.5} scale={16} blur={2.5} far={5} resolution={256} />}
          </Suspense>
          <OrbitControls makeDefault target={[0, 0.2, 0]} enabled={complete} enablePan={false} enableZoom={Boolean(customization)} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.05} />
        </Canvas>
      </ViewerBoundary>
      {!customization && <div className="assembly-panel">
        <div className="assembly-caption" role="status">{!ready ? `PREPARING ${modelName.toUpperCase()}` : complete ? "BUILT TO THRILL / DRAG TO EXPLORE" : "PRECISION IN EVERY PIECE"}</div>
        <div className="assembly-track" role="progressbar" aria-label="Car assembly" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
        <div className="assembly-actions">
          <span>{!ready ? "Loading 3D model…" : complete ? "ASSEMBLY COMPLETE" : `ASSEMBLING · ${String(progress).padStart(2, "0")}%`}</span>
          {ready && !reducedMotion && <button type="button" onClick={() => {
            if (complete) { setSkip(false); setProgress(0); setRun((value) => value + 1); }
            else setSkip(true);
          }}>{complete ? <>Replay assembly <Icon name="replay"/></> : <>Skip intro <Icon name="arrow-right"/></>}</button>}
        </div>
      </div>}
    </div>
  );
}


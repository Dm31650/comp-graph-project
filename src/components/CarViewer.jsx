
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Center,
  ContactShadows,
  useGLTF,
} from "@react-three/drei";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { gsap } from "gsap";
import * as THREE from "three";
import CarModel from "./CarModel";

/* =========================
   SHOWROOM FLOOR
========================= */

function ShowroomFloor({ floorY }) {
  return (
    <group>
      {/* Dark matte floor */}
      <mesh
        position={[0, floorY - 0.04, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />

        <meshStandardMaterial
          color="#08090b"
          metalness={0}
          roughness={1}
        />
      </mesh>

      {/* Soft contact shadow */}
      <ContactShadows
        position={[0, floorY - 0.025, 0]}
        opacity={0.45}
        scale={10}
        blur={3}
        far={5}
        resolution={512}
        color="#000000"
      />
    </group>
  );
}

/* =========================
   ANIMATED PORSCHE
========================= */

function AnimatedCar() {
  const carRef = useRef(null);
  const [ready, setReady] = useState(false);

  const { scene } = useGLTF(
    "/models/porsche/scene.gltf"
  );

  const dimensions = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();

    box.getSize(size);

    return size;
  }, [scene]);

  const floorY = -dimensions.y / 2;

  useEffect(() => {
    if (!ready || !carRef.current) return;

    const animation = gsap.fromTo(
      carRef.current.scale,
      { x: 0.01, y: 0.01, z: 0.01 },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 2.2,
        delay: 0.3,
        ease: "power3.out",
      }
    );

    return () => animation.kill();
  }, [ready]);

  return (
    <group position={[-2.2, 0.15, 0]} scale={1.45}>
      <group ref={carRef}>
        <Center onCentered={() => setReady(true)}>
          <CarModel />
        </Center>
      </group>

      <ShowroomFloor floorY={floorY} />
    </group>
  );
}

/* =========================
   CAR VIEWER
========================= */

function CarViewer() {
  return (
    <Canvas
      camera={{
        position: [-6, 2.5, -9],
        fov: 40,
      }}
      gl={{
        antialias: true,
        alpha: true,
      }}
      dpr={[1, 2]}
      shadows
    >
      {/* Studio lighting */}
      <ambientLight intensity={0.85} />

      <directionalLight
        position={[5, 10, 5]}
        intensity={3}
      />

      <directionalLight
        position={[-5, 4, -5]}
        intensity={2}
      />

      <spotLight
        position={[3, 8, -6]}
        angle={0.7}
        penumbra={1}
        intensity={75}
        distance={25}
        color="#ffffff"
      />

      <pointLight
        position={[-5, 3, 3]}
        intensity={18}
        distance={12}
        color="#ff6534"
      />

      <Suspense fallback={null}>
        <AnimatedCar />

        <Environment
          preset="city"
          environmentIntensity={0.8}
        />
      </Suspense>

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}

export default CarViewer;

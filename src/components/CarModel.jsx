import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { gsap } from "gsap";
import { applyCustomization } from "./carCustomization";
import { createCarInstance } from "./carAssembly";


function CarModel({ modelUrl = "/models/porsche/scene.gltf", modelRotation = 0, run = 0, skip = false, reducedMotion = false, onProgress, onReady, customization, onPartSelect, driveSpeed = 0 }) {
  const { scene } = useGLTF(modelUrl);
  const customizable = Boolean(customization);
  // StrictMode can invoke this twice. Each run must own its root and materials.
  const { assembly, prepared } = useMemo(
    () => createCarInstance(scene, modelUrl, customizable),
    [scene, modelUrl, customizable],
  );

  const spinningWheels = useMemo(() => {
    if (!prepared) return [];
    const materials = new Set(prepared.entries.filter(entry => entry.wheels || customization?.targets?.wheels?.includes(entry.partId)).map(entry=>entry.material));
    return assembly.pieces.filter(({mesh})=>{
      const assigned=Array.isArray(mesh.material)?mesh.material:[mesh.material];
      const box=mesh.geometry.boundingBox;
      return assigned.some(material=>materials.has(material)) && box && Math.max(box.max.x-box.min.x,box.max.y-box.min.y,box.max.z-box.min.z)<1.8;
    });
  }, [assembly, prepared, customization?.targets]);
  useFrame((_, delta) => {
    if (!driveSpeed) return;
    spinningWheels.forEach(({mesh})=>{const box=mesh.geometry.boundingBox;const axis=box.max.x-box.min.x<box.max.z-box.min.z?'x':'z';mesh.rotation[axis]-=Math.min(delta,.05)*driveSpeed*.04;});
  });
  useLayoutEffect(() => {
    if (prepared && customization) applyCustomization(prepared, customization, customization.targets || {});
  }, [prepared, customization]);

  useEffect(() => () => {
    assembly.pieces.forEach(({ mesh }) => mesh.geometry.dispose());
    prepared?.entries.forEach(({ material }) => material.dispose());
    prepared?.numberTexture.dispose();
  }, [assembly, prepared]);

  useLayoutEffect(() => {
    onReady?.(assembly.floorY);
    const timeline = gsap.timeline();
    assembly.pieces.forEach(({ mesh, home, offset, delay }) => {
      mesh.position.copy(home);
      if (skip || reducedMotion) return;
      mesh.position.add(offset);
      timeline.to(mesh.position, {
        x: home.x, y: home.y, z: home.z, duration: 2.5, ease: "power3.inOut",
      }, delay);
    });
    let last = -1;
    const report = () => {
      const value = Math.round(timeline.progress() * 100);
      if (last !== value) { last = value; onProgress?.(value); }
    };
    if (skip || reducedMotion) onProgress?.(100);
    else {
      onProgress?.(0);
      timeline.eventCallback("onUpdate", report);
      timeline.eventCallback("onComplete", () => onProgress?.(100));
    }
    return () => timeline.kill();
  }, [assembly, run, skip, reducedMotion, onProgress, onReady]);

  return <primitive object={assembly.root} rotation={[0, modelRotation, 0]} dispose={null} onClick={onPartSelect ? (event) => { event.stopPropagation(); const materials = Array.isArray(event.object.material) ? event.object.material : [event.object.material]; const material = materials[event.face?.materialIndex || 0]; if (material) onPartSelect(material.userData.customPartId); } : undefined} />;
}

useGLTF.preload("/models/porsche/scene.gltf");
export default CarModel;
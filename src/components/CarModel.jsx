import { useEffect, useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { gsap } from "gsap";
import * as THREE from "three";

// Bake the supplied rig's rest pose into independent pieces. This also avoids
// mutating useGLTF's shared cache when another viewer mounts.
export function createAssembly(scene) {
  scene.updateMatrixWorld(true);
  scene.traverse((node) => { if (node.isSkinnedMesh) node.skeleton.update(); });
  const root = new THREE.Group();
  const pieces = [];
  scene.traverse((node) => {
    if (!node.isMesh || !node.visible) return;
    const geometry = node.geometry.clone();
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      node.getVertexPosition(i, vertex).applyMatrix4(node.matrixWorld);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.deleteAttribute("skinIndex");
    geometry.deleteAttribute("skinWeight");
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, -center.z);
    const mesh = new THREE.Mesh(geometry, node.material);
    mesh.name = node.name;
    mesh.position.copy(center);
    root.add(mesh);
    pieces.push({ mesh, home: center });
  });
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 5.6 / Math.max(size.x, size.y, size.z);
  pieces.forEach((piece, i) => {
    piece.mesh.geometry.scale(scale, scale, scale);
    piece.home.sub(center).multiplyScalar(scale);
    piece.mesh.position.copy(piece.home);
    // Spatially related pieces travel together instead of random confetti.
    const p = piece.home;
    const side = p.x < 0 ? -1 : 1;
    piece.offset = new THREE.Vector3(
      side * (1.1 + Math.abs(p.x) * 0.65),
      0.7 + (p.y + size.y * scale / 2) * 1.1,
      Math.sign(p.z || 1) * (0.7 + Math.abs(p.z) * 0.45),
    );
    piece.delay = 0.45 + (p.y + size.y * scale / 2) * 0.65 + (i % 7) * 0.055;
  });
  return { root, pieces, floorY: -size.y * scale / 2 };
}

function CarModel({ modelUrl = "/models/porsche/scene.gltf", modelRotation = 0, run = 0, skip = false, reducedMotion = false, onProgress, onReady }) {
  const { scene } = useGLTF(modelUrl);
  const assembly = useMemo(() => createAssembly(scene), [scene]);

  useEffect(() => () => {
    assembly.pieces.forEach(({ mesh }) => mesh.geometry.dispose());
  }, [assembly]);

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

  return <primitive object={assembly.root} rotation={[0, modelRotation, 0]} dispose={null} />;
}

useGLTF.preload("/models/porsche/scene.gltf");
export default CarModel;

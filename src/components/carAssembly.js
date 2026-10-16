import * as THREE from "three";
import { prepareCustomization } from "./carCustomization.js";

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


export function createCarInstance(scene, modelUrl, customizable) {
  const assembly = createAssembly(scene);
  const prepared = customizable ? prepareCustomization(assembly, modelUrl) : null;
  return { assembly, prepared };
}

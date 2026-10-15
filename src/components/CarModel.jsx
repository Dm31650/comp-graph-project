
import { useGLTF } from "@react-three/drei";

function CarModel() {
  const { scene } = useGLTF(
    "/models/porsche/scene.gltf"
  );

  return (
    <primitive
      object={scene}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      scale={1}
    />
  );
}

useGLTF.preload("/models/porsche/scene.gltf");

export default CarModel;

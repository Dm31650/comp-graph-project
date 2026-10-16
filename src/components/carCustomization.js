import * as THREE from "three";

// Explicit source-material mappings keep tires, lamps and interiors untouched.
const profiles = {
  porsche: { paint: ["Material.038_0", "Material.035"], wheels: [], glass: ["Material.038_48"] },
  "bmw-m4": { paint: ["Meshesbody151Mtl"], wheels: ["Meshesm8rim1Mtl", "Meshesm8rim0011Mtl"], glass: ["Mesheswindows1Mtl"] },
  "mercedes-amg": { paint: ["body", "mirror"], wheels: [], glass: ["windows"] },
  "audi-rs7": { paint: ["sides", "material"], wheels: ["wheel"], glass: ["intern"] },
  "porsche-taycan": { paint: ["wire_"], wheels: [], glass: ["GlassWinds", "BlueGlass", "Glass"] },
  "bmw-m8": { paint: ["bBMW_M8RewardRecycled_2020Paint_Material1"], wheels: ["bBMW_M8RewardRecycled_2020_Wheel1A_3D_3DWheel2A_Material1"], glass: ["bBMW_M8RewardRecycled_2020Window_Material1"] },
};
export function getCustomizationProfile(url) {
  return profiles[url.split("/").at(-2)] || { paint: [], wheels: [], glass: [] };
}
const matches = (names, name) => names.some((value) => value.endsWith("_") ? name.startsWith(value) : name === value);

export function prepareCustomization(assembly, url) {
  const profile = getCustomizationProfile(url);
  const bounds = new THREE.Box3().setFromObject(assembly.root);
  const size = bounds.getSize(new THREE.Vector3());
  const lengthAxis = size.x > size.z ? "x" : "z";
  const widthAxis = lengthAxis === "x" ? "z" : "x";
  const numberCanvas = document.createElement("canvas");
  numberCanvas.width = numberCanvas.height = 256;
  const context = numberCanvas.getContext("2d");
  context.clearRect(0, 0, 256, 256);
  context.fillStyle = "white";
  context.font = "900 150px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("07", 128, 136);
  const numberTexture = new THREE.CanvasTexture(numberCanvas);
  const entries = [];
  assembly.pieces.forEach(({ mesh, home }, pieceIndex) => {
    mesh.material = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((original, slot) => {
      const partId = `part:${pieceIndex}:${slot}`;
      const material = original.clone();
      const uniforms = {
        design: { value: 0 }, accent: { value: new THREE.Color() },
        offset: { value: home.clone() }, low: { value: bounds.min.clone() }, size: { value: size.clone() },
        number: { value: numberTexture },
      };
      material.userData.customPartId = partId;
      const entry = { partId, material, original, uniforms, paint: matches(profile.paint, original.name), wheels: matches(profile.wheels, original.name), glass: matches(profile.glass, original.name) };
      entries.push(entry);
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, { customDesign: uniforms.design, customAccent: uniforms.accent, customOffset: uniforms.offset, customLow: uniforms.low, customSize: uniforms.size, customNumber: uniforms.number });
        shader.vertexShader = 'varying vec3 customPosition; uniform vec3 customOffset;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ncustomPosition = position + customOffset;');
        shader.fragmentShader = 'varying vec3 customPosition; uniform vec3 customLow; uniform vec3 customSize; uniform float customDesign; uniform vec3 customAccent; uniform sampler2D customNumber;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
          vec3 cp = (customPosition - customLow) / max(customSize, vec3(0.001));
          float widthPosition = abs(cp.${widthAxis} - 0.5);
          float graphic = 0.0;
          if (customDesign > 0.5 && customDesign < 1.5) graphic = step(0.035, widthPosition) * (1.0 - step(0.095, widthPosition));
          if (customDesign > 1.5 && customDesign < 2.5) graphic = 1.0 - step(0.045, abs(fract(cp.${lengthAxis} * 2.0 + cp.y * 0.6) - 0.5));
          if (customDesign > 2.5) {
            vec2 badge = vec2((cp.${lengthAxis} - 0.5) * 7.0, (cp.y - 0.43) * 3.2);
            float circle = 1.0 - smoothstep(0.46, 0.48, length(badge));
            float digits = texture2D(customNumber, badge + 0.5).a;
            graphic = circle * step(0.28, widthPosition);
            diffuseColor.rgb = mix(diffuseColor.rgb, mix(customAccent, vec3(0.015), digits), graphic);
          } else diffuseColor.rgb = mix(diffuseColor.rgb, customAccent, graphic);
        `);
      };
      material.customProgramCacheKey = () => `car-style-v1-${lengthAxis}`;
      return material;
    });
    if (mesh.material.length === 1) mesh.material = mesh.material[0];
  });
  return { entries, numberTexture };
}

export function applyCustomization(prepared, build, targets) {
  const designs = ["Clean", "Racing stripes", "Heritage", "Track number"];
  prepared.entries.forEach(({ material, original, uniforms, paint, wheels, glass, partId }) => {
    const selected = (role) => Array.isArray(targets[role]) && targets[role].includes(partId);
    const selectedWheel = selected("wheels");
    const selectedGlass = selected("glass");
    const selectedPaint = selected("paint");
    const isWheel = selectedWheel || (wheels && !selectedPaint && !selectedGlass);
    const isGlass = !isWheel && (selectedGlass || (glass && !selectedPaint));
    const isPaint = !isWheel && !isGlass && (selectedPaint || paint);
    uniforms.design.value = isPaint ? Math.max(0, designs.indexOf(build.design)) : 0;
    uniforms.accent.value.set(build.accent);
    // Restore the source first so changing a picked part is reversible.
    material.color?.copy(original.color);
    material.map = original.map;
    material.roughness = original.roughness;
    material.metalness = original.metalness;
    material.opacity = original.opacity;
    material.transparent = original.transparent;
    material.depthWrite = original.depthWrite;
    if (isPaint && material.color) {
      material.color.set(build.paint);
      material.map = null;
      material.roughness = build.finish === "Matte" ? 0.85 : build.finish === "Metallic" ? 0.27 : 0.16;
      material.metalness = build.finish === "Metallic" ? 0.8 : 0.25;
    } else if (isWheel && material.color) {
      material.color.set(build.wheels); material.map = original.map; material.metalness = 0.85; material.roughness = 0.25;
    } else if (isGlass && material.color) {
      material.color.set("#7594ac").multiplyScalar(1 - build.tint / 100);
      material.opacity = 0.2 + build.tint / 110;
      material.transparent = true; material.depthWrite = false;
    }
    material.needsUpdate = true;
  });
}


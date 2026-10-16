import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createCarInstance } from "../src/components/carAssembly.js";
import { applyCustomization } from "../src/components/carCustomization.js";

globalThis.document = { createElement: () => ({ getContext: () => ({ clearRect() {}, fillText() {} }) }) };
const url = "/models/bmw-m4/scene.glb";
const build = { paint: "#ff6534", finish: "Matte", design: "Racing stripes", accent: "#ffffff", wheels: "#c29b55", tint: 70 };

test("repeated initialization keeps editable materials attached to their own visible model", () => {
  const source = new THREE.MeshStandardMaterial({ color: "#eeeeee" });
  source.name = "Meshesbody151Mtl";
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 5), source));
  const first = createCarInstance(scene, url, true);
  const second = createCarInstance(scene, url, true);
  const showroom = createCarInstance(scene, url, false);
  applyCustomization(first.prepared, build, {});
  const visible = first.assembly.root.children[0].material;
  assert.equal(visible, first.prepared.entries[0].material);
  assert.equal(visible.color.getHexString(), "ff6534");
  assert.equal(visible.roughness, .85);
  assert.equal(first.prepared.entries[0].uniforms.design.value, 1);
  assert.notEqual(visible, second.assembly.root.children[0].material);
  assert.equal(second.assembly.root.children[0].material.color.getHexString(), "eeeeee");
  assert.equal(showroom.assembly.root.children[0].material, source);
  assert.equal(source.color.getHexString(), "eeeeee");
  applyCustomization(first.prepared, { ...build, paint: "#18785f", design: "Clean" }, {});
  assert.equal(visible.color.getHexString(), "18785f");
  assert.equal(first.prepared.entries[0].uniforms.design.value, 0);
  for (const instance of [first, second, showroom]) {
    instance.assembly.pieces.forEach(({mesh}) => mesh.geometry.dispose());
    instance.prepared?.entries.forEach(({material}) => material.dispose());
    instance.prepared?.numberTexture.dispose();
  }
  source.dispose();
});

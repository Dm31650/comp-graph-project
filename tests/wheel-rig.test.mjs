import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createAssembly } from '../src/components/carAssembly.js';
import { buildWheelRig } from '../src/components/wheelRig.js';
test('combined wheel mesh becomes four axle-centered wheels without changing body or finish',()=>{
 const scene=new Group();const paint=new MeshStandardMaterial({name:'body'}),finish=new MeshStandardMaterial({name:'wheel',color:'#c29b55'});
 scene.add(new Mesh(new BoxGeometry(2,1,5.6),paint));
 const parts=[-1,1].flatMap(x=>[-1.7,1.7].map(z=>new CylinderGeometry(.4,.4,.25,12).rotateZ(Math.PI/2).translate(x,-.4,z)));
 scene.add(new Mesh(mergeGeometries(parts),finish));
 const assembly=createAssembly(scene);const rig=buildWheelRig(assembly,'/models/audi-rs7/scene.glb',0);
 assert.equal(rig.wheels.length,4);assert.equal(rig.wheels.filter(w=>w.front).length,2);
 for(const w of rig.wheels){assert.ok(w.radius>.3&&w.radius<.5);assert.equal(w.spin.children[0].material,finish);}
 assert.equal(assembly.pieces[0].mesh.visible,true);rig.dispose();assert.ok(assembly.pieces.every(p=>p.mesh.visible));rig.attach();assert.equal(assembly.pieces[1].mesh.visible,false);rig.dispose();
});

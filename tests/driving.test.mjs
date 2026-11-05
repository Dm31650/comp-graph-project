import test from 'node:test';
import assert from 'node:assert/strict';
import { stepVehicle } from '../src/pages/drivingPhysics.js';
const state=()=>({x:0,z:0,yaw:0,speed:0,steer:0,distance:0,peak:0,hit:0});
const run=(fps)=>{const s=state();for(let i=0;i<fps*10;i++)stepVehicle(s,new Set(['KeyW']),1/fps,83,()=>false);return s;};
test('driving distance is consistent at 30 and 120 FPS',()=>{const a=run(30),b=run(120);assert.ok(Math.abs(a.distance-b.distance)<.5);assert.ok(a.speed>40&&a.speed<=83);});
test('Space brakes to a stop even when throttle is held',()=>{const s=state();s.speed=30;for(let i=0;i<120;i++)stepVehicle(s,new Set(['KeyW','Space']),1/60,83,()=>false);assert.equal(s.speed,0);});
test('substeps stop a fast car before a narrow obstacle',()=>{const s=state();s.speed=80;stepVehicle(s,new Set(['KeyW']),.08,83,(x,z)=>z<=-2);assert.ok(s.z>-2);assert.equal(s.speed,0);assert.ok(s.hit>0);});
test('steering input returns smoothly to center',()=>{const s=run(60);stepVehicle(s,new Set(['KeyA']),.08,83,()=>false);assert.ok(s.steer>0);for(let i=0;i<120;i++)stepVehicle(s,new Set(),1/60,83,()=>false);assert.ok(s.steer<.001);});

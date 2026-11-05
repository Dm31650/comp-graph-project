export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function stepVehicle(state,input,delta,maxSpeed,blocked) {
 const count=Math.ceil(Math.min(delta,.08)/(.008333333));
 if(!count)return;
 const dt=Math.min(delta,.08)/count;
 for(let i=0;i<count;i++) {
  const old=state.speed;
  const throttle=(input.has('KeyW')?1:0)-(input.has('KeyS')?1:0);
  const braking=input.has('Space');
  const desired=((input.has('KeyA')?1:0)-(input.has('KeyD')?1:0))*.52;
  state.steer+=(desired-(state.steer||0))*(1-Math.exp(-dt*8));
  if(braking)state.speed=Math.sign(old)*Math.max(0,Math.abs(old)-21*dt);
  else {
   const power=old*throttle<0?18:10*Math.max(.2,1-Math.abs(old)/maxSpeed*.72);
   state.speed+=throttle*power*dt;
   const resistance=throttle?.35:1.7;
   state.speed=Math.sign(state.speed)*Math.max(0,Math.abs(state.speed)-resistance*dt);
  }
  state.speed=clamp(state.speed,-8,maxSpeed);
  // Reduce steering at speed to keep lateral acceleration within tire grip.
  const angle=clamp(state.steer,-Math.atan(9.5*3.1/Math.max(1,state.speed**2)),Math.atan(9.5*3.1/Math.max(1,state.speed**2)));
  const nextYaw=state.yaw+state.speed/3.1*Math.tan(angle)*dt;
  const x=state.x-Math.sin(nextYaw)*state.speed*dt,z=state.z-Math.cos(nextYaw)*state.speed*dt;
  if(blocked(x,z)){state.speed=0;state.hit=1;state.acceleration=-old/dt;break;}
  else {state.x=x;state.z=z;state.yaw=nextYaw;state.distance+=Math.abs(state.speed)*dt;}
  state.acceleration=(state.speed-old)/dt;
  state.peak=Math.max(state.peak||0,Math.abs(state.speed)*3.6);
  state.hit=Math.max(0,state.hit-dt);
 }
}

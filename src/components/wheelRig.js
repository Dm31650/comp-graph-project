import { Box3, BufferAttribute, BufferGeometry, Group, Mesh, Vector3 } from 'three';

const exact = {
 porsche: /^(Material\.058|Material\.038_(58|59|60|61|62))$/,
 'bmw-m4': /Meshesm8rim/,
 'bmw-m8': /Wheel1A_3D/,
 'mercedes-amg': /^(Front_Tire|Front_Tire\.001)$/,
 'audi-rs7': /^wheel$/,
 'porsche-taycan': /^(WheelTire|WheelPlasticBlackBolt)$/,
};

// Split only known wheel materials. Material references retain the user's finish.
export function buildWheelRig(assembly, url, rotation = 0) {
 const match = exact[url.split('/').at(-2)];
 if (!match) return { wheels: [], attach() {}, dispose() {} };
 const buckets = Array.from({length:4},()=>({ parts:[], bounds:new Box3() }));
 const hidden=[];const temporary=[];
 for(const {mesh,home} of assembly.pieces) {
  const material=mesh.material;
  if(Array.isArray(material)||!match.test(material.name))continue;
  const raw=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
  const position=raw.attributes.position;const ids=Array.from({length:4},()=>[]);
  for(let i=0;i<position.count;i+=3) {
   const x=(position.getX(i)+position.getX(i+1)+position.getX(i+2))/3+home.x;
   const z=(position.getZ(i)+position.getZ(i+1)+position.getZ(i+2))/3+home.z;
   const quadrant=(x>0?2:0)+(z>0?1:0);
   ids[quadrant].push(i,i+1,i+2);
  }
  ids.forEach((indices,q)=>{
   if(!indices.length)return;
   const geometry=new BufferGeometry();
   for(const [name,attribute] of Object.entries(raw.attributes)) {
    if(attribute.isInterleavedBufferAttribute)continue;
    const data=new attribute.array.constructor(indices.length*attribute.itemSize);
    indices.forEach((index,i)=>{for(let c=0;c<attribute.itemSize;c++)data[i*attribute.itemSize+c]=attribute.array[index*attribute.itemSize+c];});
    geometry.setAttribute(name,new BufferAttribute(data,attribute.itemSize,attribute.normalized));
   }
   geometry.translate(home.x,home.y,home.z);geometry.computeBoundingBox();
   buckets[q].bounds.union(geometry.boundingBox);
   buckets[q].parts.push(new Mesh(geometry,material));temporary.push(geometry);
  });
  raw.dispose();mesh.visible=false;hidden.push(mesh);
 }
 const wheels=buckets.filter(b=>!b.bounds.isEmpty()).map(bucket=>{
  const center=bucket.bounds.getCenter(new Vector3());const size=bucket.bounds.getSize(new Vector3());
  const steering=new Group(),spin=new Group();steering.position.copy(center);steering.add(spin);
  bucket.parts.forEach(mesh=>{mesh.geometry.translate(-center.x,-center.y,-center.z);mesh.castShadow=true;spin.add(mesh);});
  assembly.root.add(steering);
  return {steering,spin,front:center.z*Math.cos(rotation)<0,radius:Math.max(.2,size.y/2)};
 });
 return {wheels,attach(){hidden.forEach(mesh=>mesh.visible=false);wheels.forEach(w=>assembly.root.add(w.steering));},dispose(){temporary.forEach(g=>g.dispose());wheels.forEach(w=>assembly.root.remove(w.steering));hidden.forEach(mesh=>mesh.visible=true);}};
}

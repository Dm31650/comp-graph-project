export const CITY_EDGE = 288;
export const STREETS = Array.from({length:13},(_,i)=>(i-6)*48);
export const PARKS = STREETS.slice(0,-1).flatMap((x,i)=>STREETS.slice(0,-1).flatMap((z,j)=>(i*3+j)%11===0?[{x:x+24,z:z+24}]:[]));
export const BLOCKS = STREETS.slice(0,-1).flatMap((x,i)=>STREETS.slice(0,-1).flatMap((z,j)=>{
 if(PARKS.some(p=>p.x===x+24&&p.z===z+24))return [];
 return [-1,1].flatMap(sx=>[-1,1].map(sz=>({x:x+24+sx*8.5,z:z+24+sz*8.5,w:11,d:11,
 h:10+((i*7+j*3+(sx+sz+2)*2)%6)*5+(Math.abs(x)<100&&Math.abs(z)<100?15:0),
 color:['#777f84','#65747c','#b3a79b','#596b72'][(i+j+sx+sz+2)%4]})));
}));
export const roadDistance=n=>Math.min(...STREETS.map(s=>Math.abs(n-s)));

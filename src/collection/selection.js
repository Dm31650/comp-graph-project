import { useMemo, useSyncExternalStore } from 'react';
import { cars } from '../data/cars.js';
const key='limitless-vehicle-shortlist-v1';let fallback='{"favorites":[],"compare":[]}';
export function normalizeSelection(value){
 const valid=items=>Array.isArray(items)?[...new Set(items.filter(id=>Number.isInteger(id)&&cars.some(car=>car.id===id)))]:[];
 return {favorites:valid(value?.favorites),compare:valid(value?.compare).slice(0,3)};
}
function snapshot(){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
function subscribe(listener){const storage=e=>{if(e.key===key||e.key===null)listener();};window.addEventListener('storage',storage);window.addEventListener('showroom:selection',listener);return()=>{window.removeEventListener('storage',storage);window.removeEventListener('showroom:selection',listener);};}
export function updateSelection(action,id){
 let value;try{value=normalizeSelection(JSON.parse(snapshot()));}catch{value=normalizeSelection({});}
 if(action==='clearCompare')value.compare=[];
 else if(['favorites','compare'].includes(action)&&cars.some(c=>c.id===id)){
  if(value[action].includes(id))value[action]=value[action].filter(n=>n!==id);
  else if(action!=='compare'||value.compare.length<3)value[action].push(id);
 }
 fallback=JSON.stringify(value);try{localStorage.setItem(key,fallback);}catch{}
 window.dispatchEvent(new Event('showroom:selection'));
}
export function useVehicleSelection(){const raw=useSyncExternalStore(subscribe,snapshot,()=>fallback);return useMemo(()=>{try{return normalizeSelection(JSON.parse(raw));}catch{return normalizeSelection({});}},[raw]);}

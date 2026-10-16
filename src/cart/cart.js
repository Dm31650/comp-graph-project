import { cars } from "../data/cars.js";
export const formatMoney = (amount) => new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
export function normalizeDesign(value) {
  if (!value || typeof value !== "object") return null;
  const color = (v, fallback) => /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : fallback;
  const targets = Object.fromEntries(["paint", "wheels", "glass"].filter(key => Array.isArray(value.targets?.[key])).map(key => [key, [...new Set(value.targets[key].filter(id => typeof id === "string" && /^part:\d+:\d+$/.test(id)))].sort().slice(0, 1000)]));
  return { paint: color(value.paint, "#aeb9c6"), finish: ["Gloss", "Matte", "Metallic"].includes(value.finish) ? value.finish : "Gloss", design: ["Clean", "Racing stripes", "Heritage", "Track number"].includes(value.design) ? value.design : "Clean", accent: color(value.accent, "#ff6534"), wheels: color(value.wheels, "#b9bec7"), tint: Number.isFinite(value.tint) ? Math.max(0, Math.min(85, value.tint)) : 45, studio: ["Daylight", "Warm", "Track"].includes(value.studio) ? value.studio : "Daylight", targets };
}
export const itemKey = (carId, design) => `${carId}:${JSON.stringify(normalizeDesign(design))}`;
export function cleanCart(value) {
  if (!Array.isArray(value)) return [];
  return value.reduce((items, item) => {
    if (!item || !cars.some(car => car.id === item.carId) || !Number.isInteger(item.quantity) || item.quantity < 1) return items;
    const design = normalizeDesign(item.design);
    const key = itemKey(item.carId, design);
    const found = items.find(row => row.key === key);
    if (found) found.quantity = Math.min(10, found.quantity + item.quantity);
    else items.push({ key, carId: item.carId, design, quantity: Math.min(10, item.quantity) });
    return items;
  }, []);
}
export function cartReducer(items, action) {
  if (action.type === "clear") return [];
  if (action.type === "remove") return items.filter(item => item.key !== action.key);
  if (action.type === "quantity") return items.map(item => item.key === action.key ? { ...item, quantity: Math.max(1, Math.min(10, Math.trunc(Number(action.quantity)) || 1)) } : item);
  if (action.type === "add") return cleanCart([...items, {carId: action.carId, design: action.design, quantity: 1}]);
  return items;
}
export const cartTotal = items => items.reduce((sum, item) => sum + (cars.find(car => car.id === item.carId)?.price || 0) * item.quantity, 0);
export function downloadText(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

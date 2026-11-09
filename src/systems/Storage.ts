export const STORAGE_PREFIX = 'cfcool.';
const key = (name: string) => `${STORAGE_PREFIX}${name}`;

export function readNumber(key: string, fallback = 0): number {
  try {
    const value = Number(globalThis.localStorage?.getItem(key));
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }
  catch {
    return fallback;
  }
}
export function writeValue(key: string, value: string): void { try {
  globalThis.localStorage?.setItem(key, value);
}
catch { /* Private browsing can disable storage. */ } }
export function getBest(): number { return readNumber(key('best')); }
export function saveBest(value: number): void { writeValue(key('best'), String(value)); }
export function getSound(): boolean { try {
  return globalThis.localStorage?.getItem(key('sound')) !== 'off';
}
catch {
  return true;
} }
export function saveSound(enabled: boolean): void { writeValue(key('sound'), enabled ? 'on' : 'off'); }
export type Skin = 'Neon' | 'Plasma' | 'Chrome' | 'Hologram' | 'Quantum';
export const SKINS: { name: Skin; at: number }[] = [{name:'Neon',at:0},{name:'Plasma',at:10},{name:'Chrome',at:25},{name:'Hologram',at:45},{name:'Quantum',at:70}];
export function getUnlockedSkins(best = getBest()): Skin[] { return SKINS.filter(s => best >= s.at).map(s => s.name); }
export function getSkin(): Skin { try { const skin = globalThis.localStorage?.getItem(key('skin')) as Skin | null; return getUnlockedSkins().includes(skin as Skin) ? skin! : 'Neon'; } catch { return 'Neon'; } }
export function saveSkin(skin: Skin): void { if (getUnlockedSkins().includes(skin)) writeValue(key('skin'), skin); }

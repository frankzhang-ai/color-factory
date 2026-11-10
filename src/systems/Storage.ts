export const STORAGE_PREFIX = 'cfcute.';
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
export function getBest(): number { return readNumber(STORAGE_PREFIX + 'best'); }
export function saveBest(value: number): void { writeValue(STORAGE_PREFIX + 'best', String(value)); }
export function getSound(): boolean { try {
  return globalThis.localStorage?.getItem(STORAGE_PREFIX + 'sound') !== 'off';
}
catch {
  return true;
} }
export function saveSound(enabled: boolean): void { writeValue(STORAGE_PREFIX + 'sound', enabled ? 'on' : 'off'); }
export type Skin = 'Classic' | 'Strawberry' | 'Bunny' | 'Star' | 'Rainbow';
export const SKINS: { name: Skin; at: number }[] = [{name:'Classic',at:0},{name:'Strawberry',at:10},{name:'Bunny',at:25},{name:'Star',at:50},{name:'Rainbow',at:100}];
export function getUnlockedSkins(best = getBest()): Skin[] { return SKINS.filter(s => best >= s.at).map(s => s.name); }
export function getSkin(): Skin { try { const skin = globalThis.localStorage?.getItem(STORAGE_PREFIX + 'skin') as Skin | null; return getUnlockedSkins().includes(skin as Skin) ? skin! : 'Classic'; } catch { return 'Classic'; } }
export function saveSkin(skin: Skin): void { if (getUnlockedSkins().includes(skin)) writeValue(STORAGE_PREFIX + 'skin', skin); }

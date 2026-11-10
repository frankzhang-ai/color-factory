export const STORAGE_PREFIX = 'cflv.';
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
export type Skin = 'Classic' | 'Strawberry' | 'Bunny' | 'Star' | 'Rainbow' | 'Sunny' | 'Galaxy';
export const SKINS: { name: Skin; at: number }[] = [{name:'Classic',at:0},{name:'Strawberry',at:6},{name:'Bunny',at:18},{name:'Star',at:36},{name:'Rainbow',at:60}];
export function getUnlockedSkins(): Skin[] {
  const stars = readNumber(STORAGE_PREFIX + 'totalStars');
  const maxStreak = readNumber(STORAGE_PREFIX + 'dailyMaxStreak');
  return [...SKINS.filter(s => stars >= s.at).map(s => s.name), ...(maxStreak >= 3 ? ['Sunny' as const] : []), ...(maxStreak >= 7 ? ['Galaxy' as const] : [])];
}
export function getSkin(): Skin { try { const skin = globalThis.localStorage?.getItem(STORAGE_PREFIX + 'skin') as Skin | null; return getUnlockedSkins().includes(skin as Skin) ? skin! : 'Classic'; } catch { return 'Classic'; } }
export function saveSkin(skin: Skin): void { if (getUnlockedSkins().includes(skin)) writeValue(STORAGE_PREFIX + 'skin', skin); }
export function nextSkinUnlock(): {name: Skin; at:number; remaining:number}|null {
 const stars=readNumber(STORAGE_PREFIX+'totalStars'); const next=SKINS.find(s=>s.at>stars);
 return next?{...next,remaining:next.at-stars}:null;
}

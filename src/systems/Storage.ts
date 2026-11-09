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
export function getBest(): number { return readNumber('colorfactory.best'); }
export function saveBest(value: number): void { writeValue('colorfactory.best', String(value)); }
export function getSound(): boolean { try {
  return globalThis.localStorage?.getItem('colorfactory.sound') !== 'off';
}
catch {
  return true;
} }
export function saveSound(enabled: boolean): void { writeValue('colorfactory.sound', enabled ? 'on' : 'off'); }
export type Skin = 'Classic' | 'Candy' | 'Marble' | 'Neon' | 'Gold';
export const SKINS: { name: Skin; at: number }[] = [{name:'Classic',at:0},{name:'Candy',at:20},{name:'Marble',at:50},{name:'Neon',at:100},{name:'Gold',at:200}];
export function getUnlockedSkins(best = getBest()): Skin[] { return SKINS.filter(s => best >= s.at).map(s => s.name); }
export function getSkin(): Skin { try { const skin = globalThis.localStorage?.getItem('colorfactory.skin') as Skin | null; return getUnlockedSkins().includes(skin as Skin) ? skin! : 'Classic'; } catch { return 'Classic'; } }
export function saveSkin(skin: Skin): void { if (getUnlockedSkins().includes(skin)) writeValue('colorfactory.skin', skin); }

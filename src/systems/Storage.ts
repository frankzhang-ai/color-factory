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

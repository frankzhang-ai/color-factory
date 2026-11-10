type ClockHook = (() => number) | null;
let clockForTests: ClockHook = null;
export function setClockForTests(fn: ClockHook): void { clockForTests = fn; }
export function now(): number {
  if (clockForTests) return clockForTests();
  const hooked = (globalThis as typeof globalThis & { __CF_NOW__?: unknown }).__CF_NOW__;
  return typeof hooked === 'number' && Number.isFinite(hooked) ? hooked : Date.now();
}
export function localDateKey(ms = now()): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function dayIndex(key: string): number { const [y,m,d] = key.split('-').map(Number); return Math.floor(Date.UTC(y,m-1,d)/86400000); }
export function addDays(key: string, n: number): string { const d = new Date((dayIndex(key)+n)*86400000); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`; }

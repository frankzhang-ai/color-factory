import { STORAGE_PREFIX } from './Storage.ts';
declare global {
  interface Window {
    goatcounter?: { count: (event: { path: string; title: string; event: true }) => void };
  }
}

export function scoreBand(score: number): '0-4' | '5-9' | '10-19' | '20+' {
  if (score < 5) return '0-4';
  if (score < 10) return '5-9';
  if (score < 20) return '10-19';
  return '20+';
}

export function track(name: string, title?: string): void {
  try {
    if (window.goatcounter && typeof window.goatcounter.count === 'function')
      window.goatcounter.count({ path: name, title: title || name, event: true });
  } catch {}
}

export function trackWhenReady(name: string, title?: string): void {
  const started = Date.now();
  const attempt = (): void => {
    try {
      if (window.goatcounter && typeof window.goatcounter.count === 'function') {
        track(name, title);
        return;
      }
    } catch { return; }
    if (Date.now() - started < 10000) window.setTimeout(attempt, 250);
  };
  attempt();
}

export function trackReturns(now = new Date()): void {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  try {
    const first = localStorage.getItem(STORAGE_PREFIX + 'first');
    if (!first) {
      localStorage.setItem(STORAGE_PREFIX + 'first', date);
      return;
    }
    if (date <= first) return;
    if (localStorage.getItem(STORAGE_PREFIX + 'lastReturn') !== date) {
      trackWhenReady('cf-return-d1');
      localStorage.setItem(STORAGE_PREFIX + 'lastReturn', date);
    }
    const firstDate = new Date(`${first}T00:00:00`);
    const today = new Date(`${date}T00:00:00`);
    const days = Math.round((today.getTime() - firstDate.getTime()) / 86400000);
    if (days === 1 && localStorage.getItem(STORAGE_PREFIX + 'lastDay1') !== date) {
      trackWhenReady('cf-return-day1');
      localStorage.setItem(STORAGE_PREFIX + 'lastDay1', date);
    }
  } catch {}
}

let sessionRuns = 0;
export function trackGameStart(): void {
  sessionRuns++;
  trackWhenReady('cf-game-start');
  if (sessionRuns === 2) trackWhenReady('cf-second-game');
}

export function trackLevelStart(n: number): void { trackWhenReady('cf-level-start-' + n); }
export function trackLevelClear(n: number): void { trackWhenReady('cf-level-clear-' + n); }
export function trackDailyPlay(): void { trackWhenReady('cf-daily-play'); }

import assert from 'node:assert/strict';
import { scoreBand, trackReturns } from '../src/systems/Analytics.ts';

assert.equal(scoreBand(0), '0-4');
assert.equal(scoreBand(4), '0-4');
assert.equal(scoreBand(5), '5-9');
assert.equal(scoreBand(9), '5-9');
assert.equal(scoreBand(10), '10-19');
assert.equal(scoreBand(19), '10-19');
assert.equal(scoreBand(20), '20+');

const values = new Map<string, string>();
const events: string[] = [];
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  },
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { goatcounter: { count: (event: { path: string }) => events.push(event.path) }, setTimeout },
});

trackReturns(new Date(2026, 0, 10));
assert.equal(values.get('cflv.first'), '2026-01-10');
assert.deepEqual(events, []);
trackReturns(new Date(2026, 0, 11));
assert.deepEqual(events, ['cf-return-d1', 'cf-return-day1']);
assert.equal(values.get('cflv.lastReturn'), '2026-01-11');
assert.equal(values.get('cflv.lastDay1'), '2026-01-11');
trackReturns(new Date(2026, 0, 11));
assert.equal(events.length, 2);
trackReturns(new Date(2026, 0, 12));
assert.deepEqual(events, ['cf-return-d1', 'cf-return-day1', 'cf-return-d1']);
console.log('analytics tests passed');

import assert from 'node:assert/strict';
import { ScoreManager, tierForCombo } from '../src/systems/ScoreManager.ts';
import { getDifficulty } from '../src/systems/DifficultyManager.ts';
import { SpawnManager } from '../src/systems/SpawnManager.ts';
const score = new ScoreManager();
assert.equal(score.sort(true).score, 1);
assert.equal(score.sort(false).lives, 2);
assert.equal(score.miss().lives, 1);
for (const [n, tier] of [[3, 'GOOD'], [5, 'GREAT'], [10, 'PERFECT'], [20, 'FANTASTIC'], [30, 'FANTASTIC']] as const)
  assert.equal(tierForCombo(n), tier);
assert.equal(tierForCombo(4), null);
assert.equal(getDifficulty(10).band, 1);
assert.equal(getDifficulty(11).band, 2);
assert.equal(getDifficulty(21).colorsInPool, 4);
assert.equal(getDifficulty(31).gapMs, 350);
assert.equal(getDifficulty(51).colorsInPool, 5);
assert.equal(getDifficulty(500).travelMs, 900);
const spawn = new SpawnManager(['coral', 'blue', 'mint', 'yellow', 'lavender'], () => 0.2);
for (let i = 0; i < 60; i++) {
  const ball = spawn.next(['coral', 'blue', 'mint', 'yellow', 'lavender']);
  assert.ok(spawn.lanes.includes(ball.color));
  assert.ok(ball.correctLane >= 0);
}
const lives = new ScoreManager();
lives.miss();
lives.miss();
assert.equal(lives.miss().gameOver, true);
console.log('logic tests passed');

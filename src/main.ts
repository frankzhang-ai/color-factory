import Phaser from 'phaser';
import { config } from './config/gameConfig.ts';
import { AudioSystem } from './systems/Audio.ts';
import { getBest } from './systems/Storage.ts';
import { trackReturns } from './systems/Analytics.ts';
import './style.css';
const game = new Phaser.Game(config);
trackReturns();
window.__COLORFACTORY__ = { getState: () => Object.freeze({ scene: 'boot', score: 0, best: getBest(), lives: 3, combo: 0, comboTier: null, band: 1, colorsInPool: 3, laneColors: ['coral', 'blue', 'mint'] as const, ball: null, travelMs: 2400, gapMs: 430, buttons: [], level:1,levelProgress:0,skin:'Classic',unlockedSkins:['Classic'],firstBallAt:null,fx: { lastCorrectAt: 0, correctCount: 0, wrongCount: 0, missCount: 0, scorePopCount: 0, particleBursts: 0, lastSound: null, soundCount: 0,tierShown:null,tierBursts:0,levelUps:0,vibrateCalls:0,lastPitch:null }, elapsedMs: 0, layout: { hud: { top: 0, bottom: 240 }, play: { top: 250, bottom: 1300 }, controls: { top: 1390, bottom: 1620 }, hint: null } }) };
const splash = document.getElementById('launch-splash');
game.events.once('ready', () => window.setTimeout(() => splash?.classList.add('hidden'), 180));
const unlock = () => { const scene = game.scene.getScene('game') as Phaser.Scene & {
  audio?: AudioSystem;
}; scene?.events.emit('audio-unlock'); scene?.audio?.unlock(); };
window.addEventListener('pointerdown', unlock, { once: true, passive: true });
window.addEventListener('touchend', unlock, { once: true, passive: true });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') {
  if (game.scene.isActive('game'))
    game.scene.getScene('game').events.emit('visibility-hidden');
}
else if (game.scene.isPaused('game')) {
  const scene = game.scene.getScene('game');
  scene.events.emit('audio-unlock');
} });
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  window.addEventListener('load', () => { void navigator.serviceWorker.register('./sw.js'); });
// iOS Safari can report stale canvas bounds after letterboxing/safe-area padding, which shifts touch input.
// Refresh Phaser's cached bounds before each touch/pointer reaches the canvas, and after layout changes.
const refreshBounds = () => { try { game.scale.updateBounds(); } catch {} };
window.addEventListener('touchstart', refreshBounds, { capture: true, passive: true });
window.addEventListener('pointerdown', refreshBounds, { capture: true, passive: true });
window.addEventListener('resize', () => { window.setTimeout(() => game.scale.refresh(), 50); });
window.addEventListener('orientationchange', () => { window.setTimeout(() => game.scale.refresh(), 300); });

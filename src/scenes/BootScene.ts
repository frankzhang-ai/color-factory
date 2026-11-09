import Phaser from 'phaser';
import { ball, text } from '../objects/draw.ts';
export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  create(): void { window.__COLORFACTORY__ = { getState: () => Object.freeze({ scene: 'boot', score: 0, best: 0, lives: 3, combo: 0, comboTier: null, band: 1, colorsInPool: 3, laneColors: Object.freeze(['coral', 'blue', 'mint'] as const), ball: null, travelMs: 2400, gapMs: 430, buttons: Object.freeze([]),level:1,levelProgress:0,skin:'Neon',unlockedSkins:['Neon'],firstBallAt:null, fx: { lastCorrectAt: 0, correctCount: 0, wrongCount: 0, missCount: 0, scorePopCount: 0, particleBursts: 0, lastSound: null, soundCount: 0,tierShown:null,tierBursts:0,levelUps:0,vibrateCalls:0,lastPitch:null }, elapsedMs: 0, layout: { hud: { top: 0, bottom: 240 }, play: { top: 250, bottom: 1300 }, controls: { top: 1390, bottom: 1620 }, hint: null } }) }; const g = this.add.graphics(); ball(g, 'coral', 310, 770, 43); ball(g, 'blue', 390, 770, 43); ball(g, 'mint', 470, 770, 43); g.fillStyle(0x293641, 1); g.fillRoundedRect(285, 825, 210, 28, 10); text(this, 390, 930, 'COLOR FACTORY', 48); this.time.delayedCall(700, () => this.scene.start('menu')); }
}

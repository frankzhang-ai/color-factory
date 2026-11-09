import Phaser from 'phaser';
import { ball, text } from '../objects/draw.ts';
export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  create(): void { window.__COLORFACTORY__ = { getState: () => Object.freeze({ scene: 'boot', score: 0, best: 0, lives: 3, combo: 0, comboTier: null, band: 1, colorsInPool: 3, laneColors: Object.freeze(['coral', 'blue', 'mint'] as const), ball: null, travelMs: 2600, gapMs: 650, buttons: Object.freeze([]) }) }; const g = this.add.graphics(); ball(g, 'coral', 310, 770, 43); ball(g, 'blue', 390, 770, 43); ball(g, 'mint', 470, 770, 43); g.fillStyle(0xeee9de, 1); g.fillRoundedRect(285, 825, 210, 22, 11); text(this, 390, 930, 'COLOR FACTORY', 48); this.time.delayedCall(700, () => this.scene.start('menu')); }
}

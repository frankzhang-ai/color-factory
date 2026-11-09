import Phaser from 'phaser';
import { ball, text, INK } from '../objects/draw.ts';
import { getBest, getSound, saveSound } from '../systems/Storage.ts';
import { soundIcon } from './ui.ts';
export class MenuScene extends Phaser.Scene {
  private soundEnabled = getSound();
  private soundGraphic?: Phaser.GameObjects.Graphics;
  constructor() { super('menu'); }
  create(): void {
    this.soundEnabled = getSound();
    window.__COLORFACTORY__ = { getState: () => Object.freeze({ scene: 'menu', score: 0, best: getBest(), lives: 3, combo: 0, comboTier: null, band: 1, colorsInPool: 3, laneColors: Object.freeze(['coral', 'blue', 'mint'] as const), ball: null, travelMs: 2600, gapMs: 650, buttons: Object.freeze([]) }) };
    const g = this.add.graphics();
    ball(g, 'coral', 285, 440, 48);
    ball(g, 'blue', 390, 440, 48);
    ball(g, 'mint', 495, 440, 48);
    g.fillStyle(0xeee9de, 1);
    g.fillRoundedRect(265, 505, 250, 25, 12);
    text(this, 390, 610, 'COLOR FACTORY', 58);
    text(this, 390, 690, 'Sort it. Match it. Keep it moving.', 25, '#77746d', 'normal');
    const play = this.add.graphics();
    play.fillStyle(0xe98980);
    play.fillRoundedRect(120, 860, 540, 150, 38);
    play.setInteractive(new Phaser.Geom.Rectangle(120, 860, 540, 150), Phaser.Geom.Rectangle.Contains).on('pointerdown', () => this.scene.start('game'));
    text(this, 390, 935, 'PLAY', 48);
    text(this, 390, 1100, 'BEST SCORE   ' + getBest(), 28);
    text(this, 390, 1290, 'Tap the button that matches the ball’s color.', 21, '#77746d', 'normal');
    text(this, 390, 1230, 'HOW TO PLAY', 22, INK);
    const box = this.add.graphics();
    box.fillStyle(0x353431, .08);
    box.fillCircle(700, 145, 46);
    this.soundGraphic = soundIcon(this, 700, 145, this.soundEnabled);
    box.setInteractive(new Phaser.Geom.Circle(700, 145, 46), Phaser.Geom.Circle.Contains).on('pointerdown', () => { this.soundEnabled = !this.soundEnabled; saveSound(this.soundEnabled); this.soundGraphic?.destroy(); this.soundGraphic = soundIcon(this, 700, 145, this.soundEnabled); });
  }
}

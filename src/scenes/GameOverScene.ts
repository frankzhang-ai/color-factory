import Phaser from 'phaser';
import { text } from '../objects/draw.ts';
import type { Tier } from '../systems/ScoreManager.ts';
import type { ColorName } from '../systems/DifficultyManager.ts';
export class GameOverScene extends Phaser.Scene {
  constructor() { super('over'); }
  create(data: {
    score: number;
    best: number;
    newBest: boolean;
    comboTier: Tier | null;
    band: number;
    colorsInPool: number;
    laneColors: ColorName[];
    travelMs: number;
    gapMs: number;
    fx: { lastCorrectAt: number; correctCount: number; wrongCount: number; missCount: number; scorePopCount: number; particleBursts: number; lastSound: string | null; soundCount: number };
    elapsedMs: number;
  }): void {
    window.__COLORFACTORY__ = { getState: () => Object.freeze({ scene: 'over', score: data.score, best: data.best, lives: 0, combo: 0, comboTier: data.comboTier, band: data.band, colorsInPool: data.colorsInPool, laneColors: Object.freeze([...data.laneColors]), ball: null, travelMs: data.travelMs, gapMs: data.gapMs, buttons: Object.freeze([]), fx: Object.freeze({ ...data.fx }), elapsedMs: data.elapsedMs, layout: { hud: { top: 0, bottom: 240 }, play: { top: 250, bottom: 1300 }, controls: { top: 1390, bottom: 1620 }, hint: null } }) };
    text(this, 390, 450, 'GAME OVER', 62);
    text(this, 390, 620, 'SCORE', 24, '#77746d');
    text(this, 390, 700, String(data.score), 90);
    text(this, 390, 810, 'BEST  ' + data.best, 30);
    if (data.newBest)
      text(this, 390, 880, 'NEW BEST', 26, '#e98980');
    this.time.delayedCall(600, () => { const g = this.add.graphics(); g.fillStyle(0xe98980); g.fillRoundedRect(120, 1020, 540, 135, 34); g.setInteractive(new Phaser.Geom.Rectangle(120, 1020, 540, 135), Phaser.Geom.Rectangle.Contains).on('pointerdown', () => this.scene.start('game')); text(this, 390, 1088, 'PLAY AGAIN', 34); const h = this.add.graphics(); h.fillStyle(0xffffff); h.fillRoundedRect(120, 1200, 540, 120, 34); h.lineStyle(3, 0xe4ded1); h.strokeRoundedRect(120, 1200, 540, 120, 34); h.setInteractive(new Phaser.Geom.Rectangle(120, 1200, 540, 120), Phaser.Geom.Rectangle.Contains).on('pointerdown', () => this.scene.start('menu')); text(this, 390, 1260, 'HOME', 31); });
  }
}

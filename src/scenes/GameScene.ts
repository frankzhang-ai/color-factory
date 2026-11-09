import Phaser from 'phaser';
import { Conveyor } from '../objects/Conveyor.ts';
import { SortButton } from '../objects/SortButton.ts';
import { ball, text, HEX, symbol } from '../objects/draw.ts';
import { getDifficulty, COLORS, type ColorName } from '../systems/DifficultyManager.ts';
import { ScoreManager, type Tier } from '../systems/ScoreManager.ts';
import { SpawnManager } from '../systems/SpawnManager.ts';
import { getBest, getSound, saveBest, saveSound } from '../systems/Storage.ts';
import { AudioSystem } from '../systems/Audio.ts';
import { pauseIcon } from './ui.ts';
import { scoreBand, track, trackGameStart } from '../systems/Analytics.ts';
type State = {
  scene: 'boot' | 'menu' | 'game' | 'paused' | 'over';
  score: number;
  best: number;
  lives: number;
  combo: number;
  comboTier: Tier | null;
  band: number;
  colorsInPool: number;
  laneColors: readonly ColorName[];
  ball: null | {
    color: ColorName;
    correctLane: number;
    progress: number;
  };
  travelMs: number;
  gapMs: number;
  buttons: readonly {
    x: number;
    y: number;
  }[];
};
declare global {
  interface Window {
    __COLORFACTORY__?: {
      getState: () => Readonly<State>;
    };
  }
}
export class GameScene extends Phaser.Scene {
  score = new ScoreManager();
  spawn!: SpawnManager;
  audio = new AudioSystem(getSound());
  lanes: SortButton[] = [];
  laneNames: ColorName[] = [];
  conveyor!: Conveyor;
  ballGraphic!: Phaser.GameObjects.Graphics;
  exitGraphic!: Phaser.GameObjects.Graphics;
  active: {
    color: ColorName;
    correctLane: number;
    start: number;
    travel: number;
  } | null = null;
  gap = 0;
  elapsed = 0;
  lanePauseUntil = 0;
  ballCount = 0;
  correctCount = 0;
  lastBand = 1;
  best = getBest();
  previousBest = getBest();
  hint!: Phaser.GameObjects.Text;
  stateScene: 'game' | 'paused' | 'over' = 'game';
  runStartedAt = 0;
  constructor() {
    super('game');
  }
  create(): void {
    trackGameStart();
    this.score = new ScoreManager();
    this.spawn = new SpawnManager();
    this.laneNames = [...this.spawn.lanes];
    this.lanes = [];
    this.active = null;
    this.elapsed = 0;
    this.gap = 0;
    this.lanePauseUntil = 0;
    this.ballCount = 0;
    this.correctCount = 0;
    this.lastBand = 1;
    this.best = getBest();
    this.previousBest = this.best;
    this.audio = new AudioSystem(getSound());
    this.stateScene = 'game';
    this.runStartedAt = this.time.now;
    text(this, 390, 55, '0', 68).setName('score');
    this.drawLives(3);
    text(this, 390, 139, 'COMBO  0', 25, '#77746d').setName('combo');
    const pause = this.add.graphics();
    pause.fillStyle(0x353431, 0.08);
    pause.fillCircle(700, 78, 44);
    pauseIcon(this, 700, 78);
    pause.setInteractive(new Phaser.Geom.Circle(700, 78, 44), Phaser.Geom.Circle.Contains)
      .on('pointerdown', () => this.showPause());
    this.conveyor = new Conveyor(this, 390, 650, 260, 820);
    this.add.existing(this.conveyor);
    this.exitGraphic = this.add.graphics();
    this.drawExits();
    this.drawDiverter();
    for (let i = 0; i < 3; i++) {
      const btn = new SortButton(this, 130 + i * 260, 1450, 224, 282, this.laneNames[i], () => this.choose(i));
      this.lanes.push(btn);
    }
    this.ballGraphic = this.add.graphics();
    this.hint = text(this, 390, 1315, 'Tap the matching color', 24, '#77746d', 'normal');
    const keys: [
      string,
      number
    ][] = [
      ['keydown-ONE', 0], ['keydown-TWO', 1], ['keydown-THREE', 2],
      ['keydown-LEFT', 0], ['keydown-DOWN', 1], ['keydown-RIGHT', 2],
    ];
    const handlers = keys.map(([key, lane]) => {
      const handler = () => this.choose(lane);
      this.input.keyboard?.on(key, handler);
      return [key, handler] as const;
    });
    const hidden = () => this.showPause();
    const unlock = () => this.audio.unlock();
    this.events.on('visibility-hidden', hidden);
    this.events.on('audio-unlock', unlock);
    this.events.once('shutdown', () => {
      handlers.forEach(([key, handler]) => this.input.keyboard?.off(key, handler));
      this.events.off('visibility-hidden', hidden);
      this.events.off('audio-unlock', unlock);
    });
    this.publish();
  }
  private drawLives(lives: number): void {
    const g = this.add.graphics();
    for (let i = 0; i < 3; i++) {
      const x = 56 + i * 43;
      if (i < lives) {
        g.fillStyle(0xe98980, 1);
        g.fillCircle(x - 5, 72, 8);
        g.fillCircle(x + 5, 72, 8);
        g.fillTriangle(x - 13, 76, x + 13, 76, x, 91);
      }
      else {
        g.lineStyle(3, 0xd7d0c5, 1);
        g.strokeCircle(x, 76, 14);
      }
    }
    g.setName('lives');
  }
  private updateLives(lives: number): void {
    this.children.getByName('lives')?.destroy();
    this.drawLives(lives);
  }
  private drawExits(): void {
    this.exitGraphic.clear();
    for (let i = 0; i < 3; i++) {
      const x = 150 + i * 240;
      this.exitGraphic.fillStyle(HEX[this.laneNames[i]], 1);
      this.exitGraphic.fillRoundedRect(x - 68, 1090, 136, 70, 22);
      symbol(this.exitGraphic, this.laneNames[i], x, 1125, 20);
      this.exitGraphic.fillStyle(0xfaf7f0, 1);
      this.exitGraphic.fillRoundedRect(x - 28, 1098, 56, 54, 14);
      symbol(this.exitGraphic, this.laneNames[i], x, 1125, 15);
    }
  }
  private drawDiverter(): void {
    const g = this.add.graphics();
    g.lineStyle(3, 0x353431, 0.12);
    [150, 390, 630].forEach((x) => g.lineBetween(390, 1040, x, 1083));
    g.fillStyle(0xe4ded1, 1);
    g.fillRoundedRect(359, 1002, 62, 48, 18);
    g.fillStyle(0xfaf7f0, 1);
    g.fillTriangle(365, 1022, 415, 1022, 390, 1060);
    g.fillStyle(0x353431, 0.08);
    g.fillCircle(390, 1017, 8);
  }
  update(_time: number, delta: number): void {
    if (this.stateScene !== 'game')
      return;
    this.conveyor.tick(delta);
    this.elapsed += delta;
    const diff = getDifficulty(this.score.score);
    if (diff.band !== this.lastBand) {
      const messages: Record<number, string> = { 2: 'SPEED UP', 3: 'NEW COLOR', 4: 'FASTER FLOW', 5: 'NEW COLOR', 6: 'SPEED UP' };
      this.toast(messages[diff.band] ?? 'SPEED UP');
      this.lastBand = diff.band;
    }
    if (this.active) {
      const progress = Math.min(1, (this.elapsed - this.active.start) / this.active.travel);
      this.ballGraphic.clear();
      ball(this.ballGraphic, this.active.color, 390, 260 + progress * 850, 47);
      if (progress >= 1) {
        this.active = null;
        this.ballGraphic.clear();
        this.resolve(false);
      }
    }
    else if (this.elapsed >= this.gap && this.elapsed >= this.lanePauseUntil) {
      const pool = COLORS.slice(0, diff.colorsInPool) as ColorName[];
      const item = this.spawn.next(pool);
      this.ballCount++;
      if (item.newLanes) {
        this.laneNames = [...this.spawn.lanes];
        this.lanes.forEach((button, i) => {
          button.setColor(this.laneNames[i]);
          this.tweens.add({ targets: button, alpha: 0.5, yoyo: true, repeat: 1, duration: 140 });
        });
        this.drawExits();
        this.toast('NEW LANES');
        this.lanePauseUntil = this.elapsed + 700;
      }
      this.active = { color: item.color, correctLane: item.correctLane, start: this.elapsed, travel: diff.travelMs };
      this.ballGraphic.clear();
      ball(this.ballGraphic, item.color, 390, 260, 47);
    }
    this.publish();
  }
  private choose(lane: number): void {
    if (this.stateScene !== 'game' || !this.active)
      return;
    const correct = lane === this.active.correctLane;
    const color = this.active.color;
    this.active = null;
    this.tweens.add({
      targets: this.ballGraphic,
      x: 130 + lane * 260 - 390,
      y: 1125 - (260 + 850),
      scale: 0.3,
      alpha: 0.2,
      duration: 190,
      ease: 'Cubic.Out',
      onComplete: () => this.ballGraphic.clear().setPosition(0, 0).setScale(1).setAlpha(1),
    });
    this.resolve(correct, color, lane);
  }
  private resolve(correct: boolean, color?: ColorName, lane?: number): void {
    const result = this.score.sort(correct);
    this.obj('score').setText(String(this.score.score));
    this.obj('combo').setText(`COMBO  ${this.score.combo}`);
    this.updateLives(this.score.lives);
    if (correct) {
      this.correctCount++;
      this.audio.tone('good');
      const x = 130 + (lane ?? 0) * 260;
      this.tweens.add({ targets: this.lanes[lane ?? 0], scaleX: 1.06, scaleY: 1.06, yoyo: true, duration: 100 });
      this.toastAt('+1', x, 1190, color);
      this.particles(x, 1125, color ?? 'mint');
      if (this.correctCount === 3) {
        this.tweens.add({ targets: this.hint, alpha: 0, duration: 500 });
      }
      if (this.score.score > this.best) {
        this.best = this.score.score;
        saveBest(this.best);
      }
    }
    else {
      this.audio.tone('bad');
      this.cameras.main.shake(140, 0.004);
      if (color)
        this.tweens.add({ targets: this.ballGraphic, alpha: 0, duration: 180, onComplete: () => this.ballGraphic.clear() });
      else
        this.toast('TOO LATE');
    }
    this.gap = this.elapsed + getDifficulty(this.score.score).gapMs;
    if (result.tier)
      this.showTier(result.tier, color ?? this.laneNames[lane ?? 0]);
    if (result.gameOver) {
      track('cf-game-over', `score ${scoreBand(this.score.score)}`);
      this.active = null;
      this.stateScene = 'over';
      this.publish();
      const finalDifficulty = getDifficulty(this.score.score);
      this.scene.start('over', {
        score: this.score.score,
        best: this.best,
        newBest: this.score.score > this.previousBest,
        comboTier: this.score.comboTier,
        band: finalDifficulty.band,
        colorsInPool: finalDifficulty.colorsInPool,
        laneColors: [...this.laneNames],
        travelMs: finalDifficulty.travelMs,
        gapMs: finalDifficulty.gapMs,
      });
    }
  }
  private obj(name: string): Phaser.GameObjects.Text {
    return this.children.getByName(name) as Phaser.GameObjects.Text;
  }
  private toast(label: string): void {
    const item = text(this, 390, 250, label, 30, '#353431');
    this.tweens.add({ targets: item, alpha: 0, y: 210, duration: 850, delay: 350, onComplete: () => item.destroy() });
  }
  private toastAt(label: string, x: number, y: number, _color?: ColorName): void {
    const item = text(this, x, y, label, 38, '#353431');
    this.tweens.add({ targets: item, scale: 1.3, alpha: 0, y: y - 65, duration: 600, onComplete: () => item.destroy() });
  }
  private showTier(tier: Tier, color: ColorName): void {
    const item = text(this, 390, 840, tier, 54, `#${HEX[color].toString(16).padStart(6, '0')}`);
    item.setScale(0.6);
    this.tweens.add({
      targets: item,
      scale: 1.15,
      duration: 220,
      ease: 'Back.Out',
      yoyo: true,
      hold: 90,
      onComplete: () => this.tweens.add({ targets: item, alpha: 0, y: 800, duration: 350, onComplete: () => item.destroy() }),
    });
  }
  private particles(x: number, y: number, color: ColorName): void {
    const g = this.add.graphics();
    g.fillStyle(HEX[color], 1);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      g.fillCircle(x + Math.cos(angle) * 25, y + Math.sin(angle) * 25, 7);
    }
    this.tweens.add({ targets: g, alpha: 0, scale: 1.8, duration: 320, onComplete: () => g.destroy() });
  }
  private showPause(): void {
    if (this.stateScene !== 'game')
      return;
    this.stateScene = 'paused';
    this.publish();
    this.scene.launch('pause');
    this.scene.pause();
  }
  private publish(): void {
    const difficulty = getDifficulty(this.score.score);
    const canvas = this.game.canvas.getBoundingClientRect();
    const buttons = this.lanes.map((button) => ({
      x: canvas.left + button.x / 780 * canvas.width,
      y: canvas.top + button.y / 1688 * canvas.height,
    }));
    const state: State = {
      scene: this.stateScene,
      score: this.score.score,
      best: this.best,
      lives: this.score.lives,
      combo: this.score.combo,
      comboTier: this.score.comboTier,
      band: difficulty.band,
      colorsInPool: difficulty.colorsInPool,
      laneColors: [...this.laneNames],
      ball: this.active ? {
        color: this.active.color,
        correctLane: this.active.correctLane,
        progress: Math.max(0, Math.min(1, (this.elapsed - this.active.start) / this.active.travel)),
      } : null,
      travelMs: difficulty.travelMs,
      gapMs: difficulty.gapMs,
      buttons,
    };
    window.__COLORFACTORY__ = {
      getState: () => Object.freeze({
        ...state,
        laneColors: Object.freeze([...state.laneColors]),
        buttons: Object.freeze(state.buttons.map((point) => Object.freeze({ ...point }))),
      }),
    };
  }
  publishForResume(): void {
    this.publish();
  }
}
export class PauseScene extends Phaser.Scene {
  private gameScene!: GameScene;
  constructor() {
    super('pause');
  }
  create(): void {
    this.gameScene = this.scene.get('game') as GameScene;
    const panel = this.add.graphics();
    panel.fillStyle(0x353431, 0.28);
    panel.fillRect(0, 0, 780, 1688);
    panel.fillStyle(0xfaf7f0, 1);
    panel.fillRoundedRect(90, 450, 600, 760, 42);
    text(this, 390, 535, 'PAUSED', 52);
    ['RESUME', 'RESTART', 'HOME'].forEach((label, index) => {
      const y = 670 + index * 145;
      const button = this.add.graphics();
      button.fillStyle(index === 0 ? 0xe98980 : 0xffffff, 1);
      button.fillRoundedRect(150, y - 48, 480, 96, 26);
      button.lineStyle(3, 0xe4ded1);
      button.strokeRoundedRect(150, y - 48, 480, 96, 26);
      button.setInteractive(new Phaser.Geom.Rectangle(150, y - 48, 480, 96), Phaser.Geom.Rectangle.Contains)
        .on('pointerdown', () => this.select(index));
      text(this, 390, y, label, 30);
    });
    const sound = text(this, 390, 1125, `SOUND  ${this.gameScene.audio.enabled ? 'ON' : 'OFF'}`, 25);
    this.add.rectangle(390, 1125, 300, 72, 0xffffff, 0).setInteractive().on('pointerdown', () => {
      this.gameScene.audio.enabled = !this.gameScene.audio.enabled;
      saveSound(this.gameScene.audio.enabled);
      sound.setText(`SOUND  ${this.gameScene.audio.enabled ? 'ON' : 'OFF'}`);
    });
  }
  private select(index: number): void {
    if (index === 0) {
      this.scene.stop();
      this.gameScene.stateScene = 'game';
      // Game time only advances in update(), so the run continues exactly where it paused.
      this.gameScene.publishForResume();
      this.scene.resume('game');
    }
    else if (index === 1) {
      this.scene.stop();
      this.scene.stop('game');
      this.scene.start('game');
    }
    else {
      this.scene.stop();
      this.scene.stop('game');
      this.scene.start('menu');
    }
  }
}

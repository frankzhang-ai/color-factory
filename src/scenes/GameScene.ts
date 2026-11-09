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
  fx: { lastCorrectAt: number; correctCount: number; wrongCount: number; missCount: number; scorePopCount: number; particleBursts: number; lastSound: string | null; soundCount: number };
  elapsedMs: number;
  layout: { hud: { top: number; bottom: number }; play: { top: number; bottom: number }; controls: { top: number; bottom: number }; hint: { x: number; y: number; w: number; h: number; visible: boolean; alpha: number } | null };
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
  wrongCount = 0;
  missCount = 0;
  scorePopCount = 0;
  particleBursts = 0;
  lastCorrectAt = 0;
  lastSound: string | null = null;
  soundCount = 0;
  lastTap = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
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
    this.wrongCount = 0; this.missCount = 0; this.scorePopCount = 0; this.particleBursts = 0; this.lastCorrectAt = 0; this.lastSound = null; this.soundCount = 0;
    this.lastTap = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
    this.lastBand = 1;
    this.best = getBest();
    this.previousBest = this.best;
    this.audio = new AudioSystem(getSound());
    this.stateScene = 'game';
    this.runStartedAt = this.time.now;
    text(this, 390, 65, '0', 84).setName('score');
    this.drawLives(3);
    text(this, 390, 155, 'COMBO  0', 27, '#77746d').setName('combo');
    const pause = this.add.graphics();
    pause.fillStyle(0x353431, 0.08);
    pause.fillCircle(710, 92, 42);
    pauseIcon(this, 710, 92);
    pause.setInteractive(new Phaser.Geom.Circle(710, 92, 42), Phaser.Geom.Circle.Contains)
      .on('pointerdown', () => this.showPause());
    this.conveyor = new Conveyor(this, 390, 690, 410, 720);
    this.add.existing(this.conveyor);
    this.exitGraphic = this.add.graphics();
    this.drawExits();
    this.drawDiverter();
    for (let i = 0; i < 3; i++) {
      const btn = new SortButton(this, 140 + i * 250, 1510, 210, 220, this.laneNames[i], () => this.choose(i));
      this.lanes.push(btn);
    }
    this.ballGraphic = this.add.graphics();
    this.hint = text(this, 390, 1360, 'Tap the matching color', 24, '#77746d', 'normal');
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
    const icons = this.children.getByName('lives');
    if (icons) this.tweens.add({ targets: icons, scale: 1.12, yoyo: true, duration: 110 });
  }
  private drawExits(): void {
    this.exitGraphic.clear();
    for (let i = 0; i < 3; i++) {
      const x = 140 + i * 250;
      this.exitGraphic.fillStyle(HEX[this.laneNames[i]], .22);
      this.exitGraphic.fillRoundedRect(x - 116, 1005, 232, 345, 34);
      this.exitGraphic.lineStyle(3, HEX[this.laneNames[i]], .72);
      this.exitGraphic.strokeRoundedRect(x - 116, 1005, 232, 345, 34);
      this.exitGraphic.fillStyle(HEX[this.laneNames[i]], .14);
      for (let yy = 1030; yy < 1335; yy += 58) this.exitGraphic.fillRoundedRect(x - 94, yy, 188, 10, 5);
      // A faint lane glyph labels the chute without reading as another control.
      this.exitGraphic.fillStyle(HEX[this.laneNames[i]], .4);
      symbol(this.exitGraphic, this.laneNames[i], x, 1080, 21);
    }
  }
  private drawDiverter(): void {
    const g = this.add.graphics();
    g.lineStyle(3, 0x353431, 0.12);
    [140, 390, 640].forEach((x) => g.lineBetween(390, 1010, x, 1050));
    g.fillStyle(0xe4ded1, 1);
    g.fillRoundedRect(354, 970, 72, 58, 18);
    g.fillStyle(0xfaf7f0, 1);
    g.fillTriangle(360, 992, 420, 992, 390, 1038);
    g.fillStyle(0x353431, 0.08);
    g.fillCircle(390, 986, 8);
  }
  update(_time: number, delta: number): void {
    if (this.stateScene !== 'game')
      return;
    this.conveyor.tick(delta, getDifficulty(this.score.score).travelMs);
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
      ball(this.ballGraphic, this.active.color, 390 + Math.sin(this.elapsed / 110) * 2, 340 + progress * 610, 70);
      if (progress >= 1) {
        this.active = null;
        this.ballGraphic.clear();
        this.ballGraphic.fillStyle(0xaaa69e, .9); this.ballGraphic.fillCircle(390, 950, 70);
        this.tweens.add({ targets: this.ballGraphic, y: 45, alpha: 0, duration: 210, onComplete: () => this.ballGraphic.clear().setPosition(0, 0).setAlpha(1) });
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
      ball(this.ballGraphic, item.color, 390, 340, 70);
    }
    this.publish();
  }
  private choose(lane: number): void {
    if (this.stateScene !== 'game' || !this.active)
      return;
    if (this.time.now - this.lastTap[lane] < 120) return;
    this.lastTap[lane] = this.time.now;
    const correct = lane === this.active.correctLane;
    const color = this.active.color;
    const wasMiss = false;
    const point = this.active ? Math.max(0, Math.min(1, (this.elapsed - this.active.start) / this.active.travel)) : 0;
    this.active = null;
    if (correct) this.tweens.add({ targets: this.ballGraphic, x: (140 + lane * 250) - 390, y: 1080 - (340 + point * 610), scale: .42, alpha: .22, duration: 260, ease: 'Cubic.InOut', onComplete: () => this.ballGraphic.clear().setPosition(0, 0).setScale(1).setAlpha(1) });
    this.resolve(correct, color, lane, wasMiss);
  }
  private resolve(correct: boolean, color?: ColorName, lane?: number, _wasMiss = false): void {
    const result = this.score.sort(correct);
    this.obj('score').setText(String(this.score.score));
    this.obj('combo').setText(`COMBO  ${this.score.combo}`);
    this.tweens.add({ targets: this.obj('combo'), scale: 1.14, yoyo: true, duration: 100 });
    this.updateLives(this.score.lives);
    if (correct) {
      this.correctCount++;
      this.lastCorrectAt = this.elapsed;
      this.playSound('correct');
      this.obj('score').setScale(1.25);
      this.tweens.add({ targets: this.obj('score'), scale: 1, duration: 200, ease: 'Back.Out' });
      this.scorePopCount++;
      const x = 140 + (lane ?? 0) * 250;
      this.exitGraphic.setAlpha(1);
      this.tweens.add({ targets: this.exitGraphic, alpha: .65, yoyo: true, duration: 120 });
      this.tweens.add({ targets: this.lanes[lane ?? 0], scaleX: 1.06, scaleY: 1.06, yoyo: true, duration: 100 });
      this.toastAt('+1', x, 1190, color);
      this.particles(x, 1115, color ?? 'mint');
      if (this.correctCount === 3) {
        this.tweens.add({ targets: this.hint, alpha: 0, duration: 500 });
      }
      if (this.score.score > this.best) {
        this.best = this.score.score;
        saveBest(this.best);
      }
    }
    else {
      if (color) this.wrongCount++; else this.missCount++;
      this.playSound(color ? 'wrong' : 'miss', false);
      this.cameras.main.shake(140, 0.004);
      if (color) {
        this.ballGraphic.clear();
        this.ballGraphic.fillStyle(0xaaa69e, .9); this.ballGraphic.fillCircle(390, 1000, 70);
        this.tweens.add({ targets: this.ballGraphic, y: 60, alpha: 0, duration: 220, onComplete: () => this.ballGraphic.clear().setPosition(0, 0).setAlpha(1) });
      }
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
        fx: { lastCorrectAt: this.lastCorrectAt, correctCount: this.correctCount, wrongCount: this.wrongCount, missCount: this.missCount, scorePopCount: this.scorePopCount, particleBursts: this.particleBursts, lastSound: this.lastSound, soundCount: this.soundCount },
        elapsedMs: this.elapsed,
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
    this.particleBursts++;
    const g = this.add.graphics();
    g.fillStyle(HEX[color], 1);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      g.fillCircle(x + Math.cos(angle) * 25, y + Math.sin(angle) * 25, 7);
    }
    this.tweens.add({ targets: g, alpha: 0, scale: 1.8, duration: 320, onComplete: () => g.destroy() });
  }
  private playSound(kind: 'correct' | 'wrong' | 'miss', good = kind === 'correct'): void {
    this.lastSound = kind; this.soundCount++;
    this.audio.tone(good ? 'good' : 'bad', this.score.combo);
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
      elapsedMs: this.elapsed,
      fx: { lastCorrectAt: this.lastCorrectAt, correctCount: this.correctCount, wrongCount: this.wrongCount, missCount: this.missCount, scorePopCount: this.scorePopCount, particleBursts: this.particleBursts, lastSound: this.lastSound, soundCount: this.soundCount },
      layout: { hud: { top: 0, bottom: 240 }, play: { top: 250, bottom: 1300 }, controls: { top: 1390, bottom: 1620 }, hint: { x: 390, y: 1360, w: 500, h: 40, visible: this.hint.alpha > 0, alpha: this.hint.alpha } },
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

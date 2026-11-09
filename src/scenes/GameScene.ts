import Phaser from 'phaser';
import { Conveyor } from '../objects/Conveyor.ts';
import { SortButton } from '../objects/SortButton.ts';
import { ball, text, HEX, floatingShapes } from '../objects/draw.ts';
import { getDifficulty, COLORS, type ColorName } from '../systems/DifficultyManager.ts';
import { ScoreManager, type Tier } from '../systems/ScoreManager.ts';
import { SpawnManager } from '../systems/SpawnManager.ts';
import { getBest, getSound, saveBest, saveSound, getSkin, getUnlockedSkins, SKINS } from '../systems/Storage.ts';
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
  level: number; levelProgress: number; skin: string; unlockedSkins: readonly string[]; firstBallAt: number | null;
  fx: { lastCorrectAt: number; correctCount: number; wrongCount: number; missCount: number; scorePopCount: number; particleBursts: number; lastSound: string | null; soundCount: number; tierShown: string | null; tierBursts: number; levelUps: number; vibrateCalls: number; lastPitch: number | null };
  elapsedMs: number;
  layout: { hud: { top: number; bottom: number }; play: { top: number; bottom: number }; controls: { top: number; bottom: number }; hint: { x: number; y: number; w: number; h: number; visible: boolean; alpha: number } | null };
  over?: {score:number;best:number;isNewBest:boolean;toBest:number;nextUnlock:{name:string;at:number;remaining:number}|null;newlyUnlocked:string|null};
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
  tierShown: string | null = null; tierBursts=0; levelUps=0; vibrateCalls=0; lastPitch:number|null=null; firstBallAt:number|null=null;
  levelText!: Phaser.GameObjects.Text; levelBar!: Phaser.GameObjects.Graphics; chuteFlash!: Phaser.GameObjects.Graphics;
  skin = getSkin();
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
    floatingShapes(this);
    trackGameStart();
    this.score = new ScoreManager();
    this.spawn = new SpawnManager();
    this.laneNames = [...this.spawn.lanes];
    this.lanes = [];
    this.active = null;
    this.elapsed = 0;
    this.gap = 350;
    this.lanePauseUntil = 0;
    this.ballCount = 0;
    this.correctCount = 0;
    this.wrongCount = 0; this.missCount = 0; this.scorePopCount = 0; this.particleBursts = 0; this.lastCorrectAt = 0; this.lastSound = null; this.soundCount = 0;
    this.lastTap = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
    this.tierShown=null;this.tierBursts=0;this.levelUps=0;this.vibrateCalls=0;this.lastPitch=null;this.firstBallAt=null;this.skin=getSkin();
    this.lastBand = 1;
    this.best = getBest();
    this.previousBest = this.best;
    this.audio = new AudioSystem(getSound());
    this.stateScene = 'game';
    this.runStartedAt = this.time.now;
    this.add.text(390,65,'0',{fontFamily:'system-ui,sans-serif',fontSize:'84px',fontStyle:'bold',color:'#353431',letterSpacing:5}).setOrigin(.5).setName('score');
    this.drawLives(3);
    text(this, 390, 155, 'COMBO  0', 22, '#77746d').setName('combo');
    const comboPill=this.add.graphics();comboPill.fillStyle(0xffffff,.72);comboPill.fillRoundedRect(302,132,176,46,23);comboPill.lineStyle(2,0xe4ded1,.9);comboPill.strokeRoundedRect(302,132,176,46,23);comboPill.setDepth(-1);
    this.levelText=text(this,390,214,'LEVEL 1',20,'#77746d');
    this.levelBar=this.add.graphics();this.drawLevelBar();
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
    this.hint = text(this, 390, 282, 'Tap the matching color', 20, '#77746d', 'normal');
    this.chuteFlash=this.add.graphics();
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
      const dx=x-390, topX=390+dx*.45;
      this.exitGraphic.fillStyle(0x27333a,1);
      this.exitGraphic.fillPoints([{x:topX-38,y:1010},{x:topX+38,y:1010},{x:x+76,y:1350},{x:x-76,y:1350}],true);
      this.exitGraphic.lineStyle(8,0x66747a,1);this.exitGraphic.lineBetween(topX-38,1010,x-76,1350);this.exitGraphic.lineBetween(topX+38,1010,x+76,1350);
      this.exitGraphic.lineStyle(7,HEX[this.laneNames[i]],1);this.exitGraphic.lineBetween(topX-34,1018,topX+34,1018);
      this.exitGraphic.fillStyle(0x111a20,1);this.exitGraphic.fillEllipse(x,1337,130,28);
      this.exitGraphic.lineStyle(4,HEX[this.laneNames[i]],.9);this.exitGraphic.strokeEllipse(x,1337,130,28);
      this.exitGraphic.fillStyle(HEX[this.laneNames[i]],.22);
      for(let yy=1060;yy<1305;yy+=62){const t=(yy-1010)/340,cx=topX+(x-topX)*t;this.exitGraphic.fillTriangle(cx-10,yy,cx+10,yy,cx,yy+21);}
    }
  }
  private drawDiverter(): void {
    const g = this.add.graphics();
    g.fillStyle(0x39464c,1);g.fillRoundedRect(340,975,100,50,12);g.lineStyle(3,0xaab4b6,1);g.strokeRoundedRect(340,975,100,50,12);
    // Flipper drawn around its pivot so it swings in place toward the chosen chute.
    const f = this.add.graphics().setPosition(390, 989);
    f.fillStyle(0xd2d8d5,1);f.fillPoints([{x:-16,y:-3},{x:16,y:-3},{x:0,y:51}],true);f.lineStyle(2,0x7b898d,1);f.strokePoints([{x:-16,y:-3},{x:16,y:-3},{x:0,y:51}],true);
    f.fillStyle(0x263239,1);f.fillCircle(0,0,8);f.setName('flipper');
  }
  private drawLevelBar():void { const p=(this.score.score%10)/10;this.levelBar.clear();this.levelBar.fillStyle(0xe4ded1,1);this.levelBar.fillRoundedRect(286,237,208,10,5);this.levelBar.fillStyle(0x85b9d8,1);this.levelBar.fillRoundedRect(286,237,208*p,10,5); }
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
      const wobble=Math.sin(this.elapsed/85);this.ballGraphic.setScale(1+Math.max(0,wobble)*.035,1-Math.max(0,wobble)*.025);
      ball(this.ballGraphic, this.active.color, 390 + Math.sin(this.elapsed / 110) * 2, 390 + progress * 560, 70,this.skin,this.elapsed/85);
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
      if(this.firstBallAt===null)this.firstBallAt=this.elapsed;
      this.ballGraphic.clear();
      ball(this.ballGraphic, item.color, 390, 390, 70,this.skin,0);
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
    if (correct) {
      // Immediate feedback (score, sound, particles) on tap; the ball animation runs on its own sprite so the next ball is not delayed.
      const y0 = 390 + point * 560;
      this.ballGraphic.clear();
      const fly = this.add.graphics().setDepth(this.ballGraphic.depth);
      ball(fly, color, 0, 0, 70, this.skin, this.elapsed / 85);
      fly.setPosition(390, y0);
      const flipper = this.children.getByName('flipper');
      if (flipper) this.tweens.add({ targets: flipper, rotation: -(lane - 1) * .48, duration: 150, yoyo: true });
      this.tweens.add({ targets: fly, scaleX: 1.18, scaleY: .78, duration: 70, yoyo: true, onComplete: () => {
        this.tweens.add({ targets: fly, x: 140 + lane * 250, y: 1080, scaleX: .08, scaleY: .08, alpha: .1, duration: 300, ease: 'Cubic.In', onComplete: () => fly.destroy() });
      } });
      this.chuteFlash.clear(); this.chuteFlash.fillStyle(HEX[color], .3); this.chuteFlash.fillEllipse(140 + lane * 250, 1337, 130, 28);
      this.tweens.add({ targets: this.chuteFlash, alpha: 0, duration: 280, onComplete: () => this.chuteFlash.clear().setAlpha(1) });
      this.resolve(true, color, lane, wasMiss);
    } else {
      this.resolve(false,color,lane,wasMiss);
    }
  }
  private resolve(correct: boolean, color?: ColorName, lane?: number, _wasMiss = false): void {
    const result = this.score.sort(correct);
    this.obj('score').setText(String(this.score.score));
    this.obj('combo').setText(`COMBO  ${this.score.combo}`);
    this.obj('combo').setStyle({color:correct?'#e98980':'#77746d'});
    this.tweens.add({ targets: this.obj('combo'), scale: 1.14, yoyo: true, duration: 100 });
    this.updateLives(this.score.lives);
    this.levelText.setText(`LEVEL ${Math.floor(this.score.score/10)+1}`);this.drawLevelBar();
    if(correct&&this.score.score>0&&this.score.score%10===0){this.levelUps++;this.levelText.setScale(1.2);this.tweens.add({targets:this.levelText,scale:1,duration:260,ease:'Back.Out'});this.levelText.setColor('#e98980');this.time.delayedCall(350,()=>this.levelText.setColor('#77746d'));this.toast(`LEVEL ${Math.floor(this.score.score/10)+1}`);this.particles(390,750,'yellow');}
    this.vibrate(correct?10:30,correct);
    if (correct) {
      this.correctCount++;
      this.lastCorrectAt = this.elapsed;
      this.playSound('correct');
      this.lastPitch=this.audio.lastPitch;
      this.obj('score').setScale(1.25);
      this.obj('score').setColor('#e98980');this.time.delayedCall(180,()=>this.obj('score').setColor('#353431'));
      this.tweens.add({ targets: this.obj('score'), scale: 1, duration: 200, ease: 'Back.Out' });
      this.scorePopCount++;
      const x = 140 + (lane ?? 0) * 250;
      this.exitGraphic.setAlpha(1);
      this.tweens.add({ targets: this.exitGraphic, alpha: .65, yoyo: true, duration: 120 });
      this.tweens.add({ targets: this.lanes[lane ?? 0], scaleX: .94, scaleY: .88, yoyo: true, duration: 105 });
      this.toastAt('+1', x, 1190, color);
      this.particles(x, 1115, color ?? 'mint');
      if(this.score.combo>=3){this.particles(x,1115,color??'mint');}
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
        previousBest:this.previousBest,
        comboTier: this.score.comboTier,
        band: finalDifficulty.band,
        colorsInPool: finalDifficulty.colorsInPool,
        laneColors: [...this.laneNames],
        travelMs: finalDifficulty.travelMs,
        gapMs: finalDifficulty.gapMs,
        fx: { lastCorrectAt: this.lastCorrectAt, correctCount: this.correctCount, wrongCount: this.wrongCount, missCount: this.missCount, scorePopCount: this.scorePopCount, particleBursts: this.particleBursts, lastSound: this.lastSound, soundCount: this.soundCount },
        elapsedMs: this.elapsed,
        level:Math.floor(this.score.score/10)+1,levelProgress:(this.score.score%10)/10,skin:this.skin,unlockedSkins:getUnlockedSkins(this.best),firstBallAt:this.firstBallAt,
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
    this.tierShown=tier;this.tierBursts++;
    const size=tier==='FANTASTIC'?86:tier==='PERFECT'?74:tier==='GREAT'?64:54;
    const item = text(this, 390, 840, tier, size, `#${HEX[color].toString(16).padStart(6, '0')}`);
    item.setScale(0.6);
    this.tweens.add({
      targets: item,
      scale: tier==='FANTASTIC'?1.45:tier==='PERFECT'?1.32:1.15,
      duration: 220,
      ease: 'Back.Out',
      yoyo: true,
      hold: 90,
      onComplete: () => this.tweens.add({ targets: item, alpha: 0, y: 800, duration: 350, onComplete: () => item.destroy() }),
    });
    if(tier!=='GOOD'){this.particles(390,840,color);this.particles(390,840,color);}
    if(tier==='GREAT'||tier==='PERFECT'||tier==='FANTASTIC'){const ring=this.add.graphics();ring.lineStyle(tier==='FANTASTIC'?8:5,HEX[color],.8);ring.strokeCircle(390,840,45);this.tweens.add({targets:ring,scale:3,alpha:0,duration:430,onComplete:()=>ring.destroy()});}
    if(tier==='PERFECT'){this.cameras.main.zoomTo(1.035,120);this.time.delayedCall(180,()=>this.cameras.main.zoomTo(1,150));}
    if(tier==='FANTASTIC'){this.cameras.main.flash(130,255,245,215);this.vibrate(10,true);const confetti=this.add.graphics();const colors=[0xe98980,0x85b9d8,0x9ac9ac,0xe9cd83,0xb8a6d9];for(let i=0;i<28;i++){confetti.fillStyle(colors[i%5],1);confetti.fillRect(250+(i*47)%280,760+(i*71)%150,9,15);}this.tweens.add({targets:confetti,alpha:0,y:70,duration:650,onComplete:()=>confetti.destroy()});}
  }
  private particles(x: number, y: number, color: ColorName): void {
    this.particleBursts++;
    const g = this.add.graphics();
    g.fillStyle(HEX[color], 1);
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      g.fillCircle(x + Math.cos(angle) * (22+(i%3)*6), y + Math.sin(angle) * (22+(i%3)*6), 6+(i%2));
    }
    this.tweens.add({ targets: g, alpha: 0, scale: 1.8, duration: 320, onComplete: () => g.destroy() });
  }
  private playSound(kind: 'correct' | 'wrong' | 'miss', good = kind === 'correct'): void {
    this.lastSound = kind; this.soundCount++;
    this.audio.tone(good ? 'good' : 'bad', this.score.combo);
  }
  private vibrate(ms:number, good:boolean):void { try { if(typeof navigator!=='undefined'&&typeof navigator.vibrate==='function'){navigator.vibrate(good&&this.score.combo%5===0?[15,25,25]:ms);this.vibrateCalls++;} } catch {} }
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
      level:Math.floor(this.score.score/10)+1,levelProgress:(this.score.score%10)/10,skin:this.skin,unlockedSkins:getUnlockedSkins(),firstBallAt:this.firstBallAt,
      fx: { lastCorrectAt: this.lastCorrectAt, correctCount: this.correctCount, wrongCount: this.wrongCount, missCount: this.missCount, scorePopCount: this.scorePopCount, particleBursts: this.particleBursts, lastSound: this.lastSound, soundCount: this.soundCount,tierShown:this.tierShown,tierBursts:this.tierBursts,levelUps:this.levelUps,vibrateCalls:this.vibrateCalls,lastPitch:this.lastPitch },
      layout: { hud: { top: 0, bottom: 250 }, play: { top: 250, bottom: 1320 }, controls: { top: 1400, bottom: 1620 }, hint: { x: 390, y: 282, w: 500, h: 36, visible: this.hint.alpha > 0, alpha: this.hint.alpha } },
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

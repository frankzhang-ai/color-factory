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
  sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
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
    if(!this.textures.exists('cool-spark')){const sparkTexture=this.add.graphics();sparkTexture.fillStyle(0xffffff,1);sparkTexture.fillCircle(4,4,4);sparkTexture.generateTexture('cool-spark',8,8);sparkTexture.destroy();}
    this.sparkEmitter=this.add.particles(0,0,'cool-spark',{speed:{min:80,max:260},angle:{min:0,max:360},scale:{start:1,end:0},alpha:{start:1,end:0},lifespan:420,quantity:12,maxParticles:150,blendMode:Phaser.BlendModes.ADD, emitting:false});this.sparkEmitter.setDepth(10);
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
    this.add.text(390,65,'0',{fontFamily:'system-ui,sans-serif',fontSize:'96px',fontStyle:'bold',color:'#ffffff',letterSpacing:3,stroke:'#22e6ff',strokeThickness:3,shadow:{offsetX:0,offsetY:0,color:'#22e6ff',blur:30,fill:true}}).setOrigin(.5).setName('score');
    this.add.text(387,65,'0',{fontFamily:'system-ui,sans-serif',fontSize:'96px',fontStyle:'bold',color:'#ff2bd6',letterSpacing:3,shadow:{offsetX:0,offsetY:0,color:'#ff2bd6',blur:24,fill:true}}).setOrigin(.5).setName('score-glitch').setDepth(-1).setAlpha(.32);
    this.drawLives(3);
    text(this, 390, 155, 'COMBO  0', 22, '#eafaff').setName('combo');
    const comboPill=this.add.graphics();comboPill.fillStyle(0x091426,.9);comboPill.fillRoundedRect(302,132,176,46,23);comboPill.lineStyle(2,0x22e6ff,.9);comboPill.strokeRoundedRect(302,132,176,46,23);comboPill.setDepth(-1);
    this.levelText=text(this,330,210,'LEVEL 1',26,'#22e6ff').setOrigin(.5);
    text(this,525,210,'0/5',20,'#ffffff').setName('level-count');
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
    this.hint = text(this, 390, 282, 'Tap the matching color', 20, '#9bb3cd', 'normal');
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
        g.fillStyle(0xff2bd6, 1);
        g.fillCircle(x - 6, 70, 9);
        g.fillCircle(x + 6, 70, 9);
        g.fillTriangle(x - 15, 75, x + 15, 75, x, 93);
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
      this.exitGraphic.fillStyle(0x02050c,.92);this.exitGraphic.fillPoints([{x:topX-43,y:1003},{x:topX+43,y:1003},{x:x+84,y:1354},{x:x-84,y:1354}],true);
      this.exitGraphic.fillStyle(0x111d2e,1);this.exitGraphic.fillPoints([{x:topX-37,y:1010},{x:topX+37,y:1010},{x:x+76,y:1350},{x:x-76,y:1350}],true);
      this.exitGraphic.lineStyle(8,0x263e59,1);this.exitGraphic.lineBetween(topX-38,1010,x-76,1350);this.exitGraphic.lineBetween(topX+38,1010,x+76,1350);
      this.exitGraphic.lineStyle(20,HEX[this.laneNames[i]],.95);this.exitGraphic.lineBetween(topX-30,1015,topX+30,1015);
      this.exitGraphic.fillStyle(0x07101e,.95);this.exitGraphic.fillEllipse(x,1337,130,28);
      this.exitGraphic.fillStyle(HEX[this.laneNames[i]],.2);this.exitGraphic.fillEllipse(x,1337,145,40);
      this.exitGraphic.lineStyle(4,HEX[this.laneNames[i]],.9);this.exitGraphic.strokeEllipse(x,1337,130,28);
      this.exitGraphic.fillStyle(HEX[this.laneNames[i]],.45);
      for(let yy=1060;yy<1305;yy+=62){const t=(yy-1010)/340,cx=topX+(x-topX)*t;this.exitGraphic.fillTriangle(cx-10,yy,cx+10,yy,cx,yy+21);}
    }
  }
  private drawDiverter(): void {
    const g = this.add.graphics();
    g.fillStyle(0x111d2e,1);g.fillRoundedRect(340,975,100,50,12);g.lineStyle(4,0x22e6ff,.9);g.strokeRoundedRect(340,975,100,50,12);
    // Flipper drawn around its pivot so it swings in place toward the chosen chute.
    const f = this.add.graphics().setPosition(390, 989);
    f.fillStyle(0x22e6ff,1);f.fillPoints([{x:-16,y:-3},{x:16,y:-3},{x:0,y:51}],true);f.lineStyle(2,0x9af5ff,1);f.strokePoints([{x:-16,y:-3},{x:16,y:-3},{x:0,y:51}],true);
    f.fillStyle(0xff2bd6,1);f.fillCircle(0,0,8);f.setName('flipper');
  }
  private drawLevelBar():void { this.levelBar.clear();this.levelBar.fillStyle(0x080e1b,1);this.levelBar.fillRoundedRect(235,231,310,22,7);for(let i=0;i<5;i++){this.levelBar.fillStyle(i<this.score.score%5?0x22e6ff:0x152238,1);this.levelBar.fillRoundedRect(240+i*61,235,55,14,3);this.levelBar.lineStyle(1,i<this.score.score%5?0x91f5ff:0x42506a,.85);this.levelBar.strokeRoundedRect(240+i*61,235,55,14,3);if(i<this.score.score%5){this.levelBar.lineStyle(7,0x22e6ff,.22);this.levelBar.strokeRoundedRect(240+i*61,235,55,14,3);}}this.levelBar.lineStyle(2,0x22e6ff,.7);this.levelBar.strokeRoundedRect(235,231,310,22,7); }
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
      const trailY=390+progress*560;for(let i=8;i>=1;i--){this.ballGraphic.fillStyle(HEX[this.active.color],.035+(9-i)*.018);this.ballGraphic.fillCircle(390,trailY-i*18,70-i*4);}
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
    this.obj('combo').setStyle({color:correct?'#ff2bd6':'#9bb3cd'});
    this.tweens.add({ targets: this.obj('combo'), scale: 1.14, yoyo: true, duration: 100 });
    this.updateLives(this.score.lives);
    const levelNow=Math.floor(this.score.score/5)+1;this.levelText.setText(`LEVEL ${levelNow}`);this.obj('level-count').setText(`${this.score.score%5}/5`);this.drawLevelBar();
    const leveled=correct&&this.score.score>0&&this.score.score%5===0;
    if(leveled){this.levelUps++;this.levelText.setScale(.7);this.tweens.add({targets:this.levelText,scale:1.2,duration:170,yoyo:true,hold:100,ease:'Back.Out'});this.levelText.setColor('#39ff88');this.time.delayedCall(550,()=>this.levelText.setColor('#22e6ff'));this.levelBar.setAlpha(.25);this.tweens.add({targets:this.levelBar,alpha:1,duration:300,yoyo:true});this.audio.tone('good',this.score.combo+3);this.cameras.main.flash(100,20,230,255);this.levelBanner(levelNow);this.particles(390,820,'yellow');}
    this.vibrate(correct?10:30,correct);
    if (correct) {
      this.correctCount++;
      this.lastCorrectAt = this.elapsed;
      this.playSound('correct');
      this.lastPitch=this.audio.lastPitch;
      this.obj('score').setScale(1.25);
      this.obj('score-glitch').setText(String(this.score.score)).setX(394+Phaser.Math.Between(-5,5)).setAlpha(.9);
      this.time.delayedCall(110,()=>this.obj('score-glitch').setAlpha(.32).setX(387));
      this.obj('score').setColor('#ff2bd6');this.time.delayedCall(180,()=>this.obj('score').setColor('#ffffff'));
      this.tweens.add({ targets: this.obj('score'), scale: 1, duration: 200, ease: 'Back.Out' });
      this.scorePopCount++;
      const x = 140 + (lane ?? 0) * 250;
      this.exitGraphic.setAlpha(1);
      this.tweens.add({ targets: this.exitGraphic, alpha: .65, yoyo: true, duration: 120 });
      this.tweens.add({ targets: this.lanes[lane ?? 0], scaleX: .94, scaleY: .88, yoyo: true, duration: 105 });
      this.toastAt('+1', x, 1190, color);
      if(this.score.combo>=2)this.toastAt(`x${this.score.combo}`,x,1290,color);
      this.particles(x, 1330, color ?? 'mint');
      this.particles(x, 1510, color ?? 'mint');
      this.shockwave(x,1334,color??'mint');this.shockwave(x,1510,color??'mint');
      this.beam(390,1005,x,1325,color??'mint');
      const chuteRing=this.add.graphics();chuteRing.lineStyle(9,0xffffff,1);chuteRing.strokeEllipse(x,1337,136,34);this.tweens.add({targets:chuteRing,alpha:0,duration:190,onComplete:()=>chuteRing.destroy()});
      this.flashButton(lane??0,color??'mint');
      if(this.score.combo>=5)this.cameras.main.shake(60,.002);
      if(this.score.combo>=5)this.particles(x,1334,color??'mint');
      if(this.score.combo>=10){const vignette=this.add.graphics().setDepth(20);vignette.lineStyle(34,HEX[color??'mint'],.6);vignette.strokeRect(8,8,764,1672);this.tweens.add({targets:vignette,alpha:0,duration:320,onComplete:()=>vignette.destroy()});}
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
        const ex=140+(lane??0)*250;const error=text(this,ex,1180,'ERROR',30,'#ff3158');error.setStroke('#ff003c',4);this.cameras.main.flash(65,255,20,55);this.time.delayedCall(330,()=>error.destroy());
        this.ballGraphic.clear();
        this.ballGraphic.fillStyle(0xaaa69e, .9); this.ballGraphic.fillCircle(390, 1000, 70);
        this.tweens.add({ targets: this.ballGraphic, y: 60, alpha: 0, duration: 220, onComplete: () => this.ballGraphic.clear().setPosition(0, 0).setAlpha(1) });
      }
      else {
        this.cameras.main.flash(100,180,0,25);
        this.toast('TOO LATE');
      }
    }
    this.gap = this.elapsed + getDifficulty(this.score.score).gapMs;
    if (result.tier) {
      const tierColor=color ?? this.laneNames[lane ?? 0];
      if(leveled)this.time.delayedCall(850,()=>this.showTier(result.tier!,tierColor));
      else this.showTier(result.tier,tierColor);
    }
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
        level:Math.floor(this.score.score/5)+1,levelProgress:(this.score.score%5)/5,skin:this.skin,unlockedSkins:getUnlockedSkins(this.best),firstBallAt:this.firstBallAt,
      });
    }
  }
  private obj(name: string): Phaser.GameObjects.Text {
    return this.children.getByName(name) as Phaser.GameObjects.Text;
  }
  private toast(label: string): void {
    const item = text(this, 390, 820, label, 34, '#353431');
    this.tweens.add({ targets: item, alpha: 0, y: 780, duration: 850, delay: 350, onComplete: () => item.destroy() });
  }
  private levelBanner(level:number):void {
    const back=this.add.graphics().setDepth(12);back.fillStyle(0x050914,.97);back.fillRoundedRect(145,286,490,104,20);back.lineStyle(4,0x22e6ff,1);back.strokeRoundedRect(145,286,490,104,20);back.lineStyle(2,0xff2bd6,.85);back.strokeRoundedRect(152,293,476,90,16);
    const a=text(this,390,337,`LEVEL ${level}`,68,'#ffffff');a.setDepth(13);a.setStroke('#ff2bd6',4);const cyan=text(this,386,337,`LEVEL ${level}`,68,'#22e6ff');cyan.setDepth(12).setAlpha(.7);
    const sweep=this.add.graphics().setDepth(14);sweep.fillStyle(0x8ef8ff,.85);sweep.fillRect(145,286,22,104);this.tweens.add({targets:sweep,x:470,alpha:.1,duration:360});
    const scan=this.add.rectangle(390,270,780,4,0x22e6ff,1).setDepth(14);this.tweens.add({targets:scan,y:410,alpha:0,duration:360,onComplete:()=>scan.destroy()});
    this.cameras.main.shake(150,.002);
    this.tweens.add({targets:[back,a,cyan,sweep],alpha:0,y:'-=12',duration:300,delay:520,onComplete:()=>{back.destroy();a.destroy();cyan.destroy();sweep.destroy();}});
  }
  private shockwave(x:number,y:number,color:ColorName):void {for(let i=0;i<2;i++){const ring=this.add.graphics().setPosition(x,y);ring.lineStyle(i?3:5,i?0xffffff:HEX[color],.95);ring.strokeCircle(0,0,24+i*12);this.tweens.add({targets:ring,scale:3.4,alpha:0,duration:310+i*90,delay:i*55,onComplete:()=>ring.destroy()});}}
  private beam(x1:number,y1:number,x2:number,y2:number,color:ColorName):void {const line=this.add.graphics().setDepth(7);line.lineStyle(26,HEX[color],.14);line.lineBetween(x1,y1,x2,y2);line.lineStyle(7,HEX[color],.7);line.lineBetween(x1,y1,x2,y2);this.tweens.add({targets:line,alpha:0,duration:210,onComplete:()=>line.destroy()});}
  private flashButton(lane:number,color:ColorName):void { const b=this.lanes[lane];const flash=this.add.graphics().setDepth(8);flash.lineStyle(10,0xffffff,1);flash.strokeRoundedRect(b.x-b.width/2,b.y-b.height/2,b.width,b.height,24);this.tweens.add({targets:flash,alpha:0,duration:180,onComplete:()=>{flash.clear();flash.lineStyle(6,HEX[color],.85);flash.strokeRoundedRect(b.x-b.width/2,b.y-b.height/2,b.width,b.height,24);this.tweens.add({targets:flash,alpha:0,duration:300,onComplete:()=>flash.destroy()});}}); }
  private toastAt(label: string, x: number, y: number, _color?: ColorName): void {
    const item = text(this, x, y, label, 38, '#353431');
    this.tweens.add({ targets: item, scale: 1.3, alpha: 0, y: y - 65, duration: 600, onComplete: () => item.destroy() });
  }
  private showTier(tier: Tier, color: ColorName): void {
    this.tierShown=tier;this.tierBursts++;
    this.tweens.add({targets:this.hint,alpha:0,duration:120});
    const size=tier==='FANTASTIC'?88:tier==='PERFECT'?78:tier==='GREAT'?68:58;
    const tierY=312;
    const targets: Phaser.GameObjects.Text[] = tier==='FANTASTIC'
      ? [...tier].map((letter,index)=>this.add.text(390-261+index*58,tierY,letter,{fontFamily:'system-ui,sans-serif',fontSize:`${size}px`,fontStyle:'bold',color:'#ffffff',stroke:`#${[0xff3d6e,0xffc23a,0x39ff88,0x2fb6ff,0xb26bff][index%5].toString(16)}`,strokeThickness:8,shadow:{offsetX:0,offsetY:0,color:'#ffffff',blur:16,fill:true}}).setOrigin(.5).setScale(.05))
      : [this.add.text(386,tierY,tier,{fontFamily:'system-ui,sans-serif',fontSize:`${size}px`,fontStyle:'bold',color:'#ffffff',stroke:`#${HEX[color].toString(16).padStart(6,'0')}`,strokeThickness:8,shadow:{offsetX:0,offsetY:0,color:'#22e6ff',blur:16,fill:true},align:'center'}).setOrigin(.5).setScale(.05),this.add.text(394,tierY,tier,{fontFamily:'system-ui,sans-serif',fontSize:`${size}px`,fontStyle:'bold',color:'#ff2bd6',align:'center'}).setOrigin(.5).setScale(.05).setAlpha(.75)];
    this.tweens.add({
      targets,
      scale: 1.2, duration: 180, ease: 'Back.Out', yoyo: true, hold: 550,
      onComplete: () => { this.tweens.add({ targets, alpha: 0, y: 500, duration: 340, onComplete: () => targets.forEach(item=>item.destroy()) }); },
    });
    if(tier!=='GOOD'){this.particles(390,tierY,color);if(tier!=='GREAT')this.particles(390,tierY,color);}
    if(tier==='GREAT'||tier==='PERFECT'||tier==='FANTASTIC'){const ring=this.add.graphics().setPosition(390,tierY);ring.lineStyle(tier==='FANTASTIC'?9:6,HEX[color],.9);ring.strokeCircle(0,0,48);this.tweens.add({targets:ring,scale:3.2,alpha:0,duration:500,onComplete:()=>ring.destroy()});}
    if(tier==='PERFECT'){this.cameras.main.zoomTo(1.035,120);this.time.delayedCall(180,()=>this.cameras.main.zoomTo(1,150));}
    if(tier==='FANTASTIC'){this.cameras.main.flash(110,255,250,235);this.vibrate(10,true);const confetti=this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);const colors=[0xff2bd6,0x22e6ff,0x39ff88,0xffc23a,0x8a5cff,0xffffff];for(let i=0;i<54;i++){const a=i*Math.PI*2/54,r=45+(i%5)*21;confetti.fillStyle(colors[i%colors.length],1);confetti.fillCircle(390+Math.cos(a)*r,350+Math.sin(a)*r,3+(i%3));}this.tweens.add({targets:confetti,alpha:0,scale:2,duration:500,onComplete:()=>confetti.destroy()});}
  }
  private particles(x: number, y: number, color: ColorName): void {
    this.particleBursts++;
    this.sparkEmitter.setParticleTint(HEX[color]);this.sparkEmitter.explode(24,x,y);
    const g = this.add.graphics();
    g.setBlendMode(Phaser.BlendModes.ADD);
    g.fillStyle(HEX[color], 1);
    for (let i = 0; i < 24; i++) {
      const angle = i * Math.PI / 12;
      const radius=22+(i%4)*9;
      g.fillStyle(i%4===0?0xffffff:HEX[color],i%4===0?1:.9);
      g.fillCircle(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 4+(i%3));
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
      level:Math.floor(this.score.score/5)+1,levelProgress:(this.score.score%5)/5,skin:this.skin,unlockedSkins:getUnlockedSkins(),firstBallAt:this.firstBallAt,
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
    panel.fillStyle(0x02040b, 0.72);
    panel.fillRect(0, 0, 780, 1688);
    panel.fillStyle(0x081426, .98);
    panel.fillRoundedRect(90, 450, 600, 760, 42);
    panel.lineStyle(4,0x22e6ff,.95);panel.strokeRoundedRect(90,450,600,760,42);panel.lineStyle(2,0xff2bd6,.7);panel.strokeRoundedRect(98,458,584,744,34);
    text(this, 390, 535, 'PAUSED', 52,'#ffffff').setStroke('#ff2bd6',2);
    ['RESUME', 'RESTART', 'HOME'].forEach((label, index) => {
      const y = 670 + index * 145;
      const button = this.add.graphics();
      button.fillStyle(0x101d32, 1);
      button.fillRoundedRect(150, y - 48, 480, 96, 26);
      button.lineStyle(3, index === 0 ? 0x22e6ff : 0xff2bd6, .95);
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

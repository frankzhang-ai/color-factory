import Phaser from 'phaser';
import { Conveyor } from '../objects/Conveyor.ts';
import { SortButton } from '../objects/SortButton.ts';
import { ball, text, HEX } from '../objects/draw.ts';
import { cuteBackdrop, factorySides, spitMachine, spit, cheerWorker } from '../objects/cuteDecor.ts';
import { getDifficulty, COLORS, type ColorName } from '../systems/DifficultyManager.ts';
import { ScoreManager, type Tier } from '../systems/ScoreManager.ts';
import { SpawnManager } from '../systems/SpawnManager.ts';
import { getBest, getSound, saveBest, saveSound, getSkin, getUnlockedSkins, SKINS } from '../systems/Storage.ts';
import { AudioSystem } from '../systems/Audio.ts';
import { pauseIcon } from './ui.ts';
import { scoreBand, track, trackGameStart } from '../systems/Analytics.ts';
import { getLevel, goalProgress, starsFor, soCloseText, type LevelDef, type RunStats } from '../systems/Levels.ts';
import { dailyChallenge, dailyRandom, recordDailyPlay, currentStreak } from '../systems/Daily.ts';
import { localDateKey, now } from '../systems/Clock.ts';
import { totalStars } from '../systems/Progress.ts';
import { trackDailyPlay, trackLevelClear, trackLevelStart } from '../systems/Analytics.ts';
import { COLORS as COLOR_LIST } from '../systems/DifficultyManager.ts';
type State = {
  scene: 'boot' | 'menu' | 'game' | 'paused' | 'over' | 'goal' | 'win' | 'fail' | 'daily-end';
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
      scrollMapTo?: (id:number)=>void;
    };
  }
}
export class GameScene extends Phaser.Scene {
  runMode:'endless'|'level'|'daily'='endless'; levelId=1; dateKey=''; private def?:LevelDef; private goalCurrent=0; private bestCombo=0; private goalProgressText?:Phaser.GameObjects.Text; private goalProgressBar?:Phaser.GameObjects.Graphics; private timerUrgent=false; private runResultSent=false; private activeTravel=2400;
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
  private workers: Phaser.GameObjects.Container[]=[]; private machine!:Phaser.GameObjects.Container;
  best = getBest();
  previousBest = getBest();
  hint!: Phaser.GameObjects.Text;
  stateScene: 'game' | 'paused' | 'over' = 'game';
  runStartedAt = 0;
  constructor() {
    super('game');
  }
  create(data:{mode?:'endless'|'level'|'daily';id?:number;dateKey?:string}={}): void {
    this.runMode=data.mode??'endless';this.levelId=data.id??1;this.dateKey=data.dateKey??localDateKey();this.runResultSent=false;this.timerUrgent=false;this.bestCombo=0;this.goalCurrent=0;
    if(this.runMode==='level')this.def=getLevel(this.levelId)!;else if(this.runMode==='daily'){const d=dailyChallenge(this.dateKey);this.def={...d,id:0,boss:false,starRule:'lives',parSec:null};}else this.def=undefined;
    cuteBackdrop(this,true);
    trackGameStart();
    this.score = new ScoreManager();
    if(this.def)this.score.lives=this.def.lives;
    this.spawn = new SpawnManager(this.def?COLOR_LIST.slice(0,this.def.colorsInPool):undefined,this.runMode==='daily'?dailyRandom(this.dateKey):Math.random);
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
    if(this.def){const titlePill=this.add.graphics();titlePill.fillStyle(0xffffff,.85);titlePill.fillRoundedRect(267,30,246,70,30);titlePill.lineStyle(3,0xffdce6,1);titlePill.strokeRoundedRect(267,30,246,70,30);}
    this.add.text(390,65,this.runMode==='endless'?'0':`${this.runMode==='daily'?'DAILY':'LEVEL '+this.levelId}`,{fontFamily:'system-ui,sans-serif',fontSize:this.runMode==='endless'?'84px':'37px',fontStyle:'bold',color:'#353431',letterSpacing:2}).setOrigin(.5).setName('score');
    this.drawLives(this.def?.lives??3);
    text(this, 390, 155, this.def?this.def.title:'COMBO  0', this.def?25:22, '#77746d').setName('combo');
    if(this.def){this.goalProgressText=text(this,390,220,`0 / ${this.def.target}`,38,'#59465b');this.goalProgressBar=this.add.graphics();}
    const comboPill=this.add.graphics();comboPill.fillStyle(0xffffff,.72);comboPill.fillRoundedRect(302,132,176,46,23);comboPill.lineStyle(2,0xe4ded1,.9);comboPill.strokeRoundedRect(302,132,176,46,23);comboPill.setDepth(-1);
    const levelPill=this.add.graphics();levelPill.fillStyle(0xff8fab,1);levelPill.fillRoundedRect(332,195,116,34,17);this.levelText=text(this,390,212,'LEVEL 1',17,'#ffffff');
    this.levelBar=this.add.graphics();this.drawLevelBar();
    if(this.def){levelPill.setVisible(false);this.levelText.setVisible(false);this.levelBar.setVisible(false);}
    const pause = this.add.graphics();
    pause.fillStyle(0x353431, 0.08);
    pause.fillCircle(710, 92, 42);
    pauseIcon(this, 710, 92);
    pause.setInteractive(new Phaser.Geom.Circle(710, 92, 42), Phaser.Geom.Circle.Contains)
      .on('pointerdown', () => this.showPause());
    const v=this.scale.height/1688;
    this.conveyor = new Conveyor(this, 390, 288 + 360*v, 410, 720*v);
    this.add.existing(this.conveyor);
    this.machine=spitMachine(this,390,510*v).setScale(1,v);this.workers=factorySides(this);
    this.exitGraphic = this.add.graphics().setScale(1,v);
    this.drawExits();
    this.drawDiverter(v);
    for (let i = 0; i < 3; i++) {
      const btn = new SortButton(this, 140 + i * 250, this.scale.height-175, 210, 190, this.laneNames[i], () => this.choose(i));
      this.lanes.push(btn);
    }
    this.ballGraphic = this.add.graphics().setDepth(5);
    this.hint = text(this, 390, this.scale.height-238, 'Tap the matching color', 20, '#77746d', 'normal');
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
    if(this.runMode==='level')trackLevelStart(this.levelId);if(this.runMode==='daily')trackDailyPlay();
  }
  private drawLives(lives: number): void {
    const g = this.add.graphics();
    for (let i = 0; i < 3; i++) {
      const x = 56 + i * 43;
      if (i < lives) {
        g.fillStyle(0xe98980, 1);
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
    for (let i=0;i<3;i++) {
      const x=140+i*250, dx=x-390, topX=390+dx*.45, color=HEX[this.laneNames[i]];
      const pale=(((255-Math.round((255-((color>>16)&255))*.45))&255)<<16)|(((255-Math.round((255-((color>>8)&255))*.45))&255)<<8)|(255-Math.round((255-(color&255))*.45));
      // Rounded candy tube with pale body and lane-colored piping.
      this.exitGraphic.fillStyle(color,.16);this.exitGraphic.fillPoints([{x:topX-43,y:1003},{x:topX+43,y:1003},{x:x+84,y:1354},{x:x-84,y:1354}],true);
      this.exitGraphic.fillStyle(pale,1);this.exitGraphic.fillPoints([{x:topX-36,y:1012},{x:topX+36,y:1012},{x:x+73,y:1347},{x:x-73,y:1347}],true);
      this.exitGraphic.lineStyle(5,color,.95);this.exitGraphic.lineBetween(topX-37,1010,x-75,1350);this.exitGraphic.lineBetween(topX+37,1010,x+75,1350);
      // Soft diagonal white candy stripes clipped visually inside the tapered tube.
      this.exitGraphic.lineStyle(13,0xffffff,.35);for(let y=1060;y<1310;y+=44){const t=(y-1010)/340,cx=topX+(x-topX)*t;this.exitGraphic.lineBetween(cx-24,y,cx+24,y+28);}
      this.exitGraphic.fillStyle(color,.95);this.exitGraphic.fillRoundedRect(topX-47,996,94,24,12);this.exitGraphic.fillStyle(0xffffff,.85);this.exitGraphic.fillRoundedRect(topX-33,1000,66,7,4);
      // Bow on each rim.
      this.exitGraphic.fillStyle(color,1);this.exitGraphic.fillPoints([{x:topX-22,y:990},{x:topX-42,y:980},{x:topX-39,y:1000}],true);this.exitGraphic.fillPoints([{x:topX+22,y:990},{x:topX+42,y:980},{x:topX+39,y:1000}],true);this.exitGraphic.fillCircle(topX,990,6);
      // Glowing mouth and a larger friendly face on the tube body.
      this.exitGraphic.fillStyle(color,.20);this.exitGraphic.fillEllipse(x,1337,145,43);this.exitGraphic.fillStyle(color,.48);this.exitGraphic.fillEllipse(x,1337,126,29);this.exitGraphic.lineStyle(4,0xffffff,.9);this.exitGraphic.strokeEllipse(x,1337,126,29);
      this.exitGraphic.fillStyle(0xffffff,1);this.exitGraphic.fillCircle(x-19,1283,12);this.exitGraphic.fillCircle(x+19,1283,12);this.exitGraphic.fillStyle(0x59465b,1);this.exitGraphic.fillCircle(x-16,1285,5);this.exitGraphic.fillCircle(x+22,1285,5);this.exitGraphic.lineStyle(3,0x59465b,1);this.exitGraphic.beginPath();this.exitGraphic.arc(x,1301,10,.1,Math.PI-.1,false);this.exitGraphic.strokePath();
      this.exitGraphic.lineStyle(5,0xffffff,.72);for(let y=1080;y<1270;y+=56){const t=(y-1010)/340,cx=topX+(x-topX)*t;this.exitGraphic.beginPath();this.exitGraphic.arc(cx,y,7,Math.PI*.15,Math.PI*.85,false);this.exitGraphic.strokePath();}
    }
  }
  private drawDiverter(v:number): void {
    const g = this.add.graphics().setScale(1,v);
    g.fillStyle(0xd8d1c6,1);g.fillRoundedRect(340,975,100,50,12);g.lineStyle(3,0xb9b2a5,1);g.strokeRoundedRect(340,975,100,50,12);
    // Flipper drawn around its pivot so it swings in place toward the chosen chute.
    const f = this.add.graphics().setPosition(390, 989*v).setScale(1,v);
    f.fillStyle(0xe9e5dc,1);f.fillPoints([{x:-16,y:-3},{x:16,y:-3},{x:0,y:51}],true);f.lineStyle(2,0xb9b2a5,1);f.strokePoints([{x:-16,y:-3},{x:16,y:-3},{x:0,y:51}],true);
    f.fillStyle(0xb9b2a5,1);f.fillCircle(0,0,8);f.setName('flipper');
  }
  private drawLevelBar():void { const p=this.score.score%5;this.levelBar.clear();for(let i=0;i<5;i++){const x=266+i*49;this.levelBar.fillStyle(0xffffff,.98);this.levelBar.fillRoundedRect(x,230,43,17,8);this.levelBar.lineStyle(2,0xff8fab,1);this.levelBar.strokeRoundedRect(x,230,43,17,8);if(i<p){this.levelBar.fillStyle(i%2?0xffb3c7:0xffd1a8,1);this.levelBar.fillRoundedRect(x+2,232,39,13,6);this.levelBar.lineStyle(2,0xffffff,.7);this.levelBar.lineBetween(x+4,242,x+15,232);this.tweens.add({targets:this.levelBar,scaleX:1.035,scaleY:1.12,duration:120,yoyo:true});}} }
  update(_time: number, delta: number): void {
    if (this.stateScene !== 'game')
      return;
    if(this.def){const left=this.def.timeLimitSec?Math.max(0,this.def.timeLimitSec-this.elapsed/1000):null;this.goalProgressText?.setText(`${this.goalCurrent} / ${this.def.target}${left!==null?`   ⏱ ${Math.ceil(left)}`:''}`);this.goalProgressText?.setColor(left!==null&&left<=5?'#d44b5c':'#59465b');if(left!==null&&left<=5&&!this.timerUrgent){this.timerUrgent=true;this.tweens.add({targets:this.goalProgressText,scale:1.12,duration:210,yoyo:true,repeat:-1,ease:'Sine.InOut'});}this.goalProgressBar?.clear();this.goalProgressBar?.fillStyle(0xffffff,.92);this.goalProgressBar?.fillRoundedRect(160,270,460,18,9);this.goalProgressBar?.fillStyle(0xff8fab,1);this.goalProgressBar?.fillRoundedRect(164,274,452*Math.min(1,this.goalCurrent/this.def.target),10,5);}
    if(this.def?.timeLimitSec&&this.elapsed/1000>this.def.timeLimitSec){this.resolve(false);return;}
    this.conveyor.tick(delta, this.difficulty().travelMs);
    this.elapsed += delta;
    const diff = this.difficulty();
    if (diff.band !== this.lastBand) {
      const messages: Record<number, string> = { 2: 'SPEED UP', 3: 'NEW COLOR', 4: 'FASTER FLOW', 5: 'NEW COLOR', 6: 'SPEED UP' };
      this.toast(messages[diff.band] ?? 'SPEED UP');
      this.lastBand = diff.band;
    }
    if (this.active) {
      const progress = Math.min(1, (this.elapsed - this.active.start) / this.active.travel);
      this.ballGraphic.clear();
      const wobble=Math.sin(this.elapsed/85);this.ballGraphic.setScale(1+Math.max(0,wobble)*.035,1-Math.max(0,wobble)*.025);
      ball(this.ballGraphic, this.active.color, 390 + Math.sin(this.elapsed / 110) * 2, 510*this.scale.height/1688 + progress * (510*this.scale.height/1688), 70,this.skin,this.elapsed/85,progress>.7?'nervous':'happy');
      if (progress >= 1) {
        const missedColor=this.active.color;
        this.active = null;
        this.ballGraphic.clear();
        ball(this.ballGraphic,missedColor,390,950,70,this.skin,this.elapsed/85,'dizzy');
        this.tweens.add({ targets: this.ballGraphic, y: 45, alpha: 0, duration: 210, onComplete: () => this.ballGraphic.clear().setPosition(0, 0).setAlpha(1) });
        this.resolve(false);
      }
    }
    else if (this.elapsed >= this.gap && this.elapsed >= this.lanePauseUntil) {
      const pool = COLOR_LIST.slice(0, diff.colorsInPool) as ColorName[];
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
      spit(this.machine);
      if(this.firstBallAt===null)this.firstBallAt=this.elapsed;
      this.ballGraphic.clear();
      ball(this.ballGraphic, item.color, 390, 510*this.scale.height/1688, 70,this.skin,0);
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
      ball(fly, color, 0, 0, 70, this.skin, this.elapsed / 85, 'happy');
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
    this.obj('score').setText(this.def?`${this.runMode==='daily'?'DAILY':'LEVEL '+this.levelId}`:String(this.score.score));
    this.obj('combo').setText(`COMBO  ${this.score.combo}`);
    this.obj('combo').setStyle({color:correct?'#e98980':'#77746d'});
    this.tweens.add({ targets: this.obj('combo'), scale: 1.14, yoyo: true, duration: 100 });
    this.updateLives(this.score.lives);
    if(!this.def){this.levelText.setText(`LEVEL ${Math.floor(this.score.score/5)+1}`);this.drawLevelBar();}
    if(!this.def&&correct&&this.score.score>0&&this.score.score%5===0){this.levelUps++;this.levelText.setColor('#ffffff');this.levelText.setScale(1);this.tweens.add({targets:this.levelText,scale:1.2,duration:170,yoyo:true,hold:100,ease:'Back.Out'});this.levelBar.setAlpha(.35);this.tweens.add({targets:this.levelBar,alpha:1,duration:300,yoyo:true});this.levelRibbon();this.particles(390,750,'yellow');}
    if(correct&&this.score.combo>=3||correct&&this.score.score>0&&this.score.score%5===0)this.workers.forEach(w=>cheerWorker(this,w));
    this.vibrate(correct?10:30,correct);
    if (correct) {
      this.correctCount++;
      this.bestCombo=Math.max(this.bestCombo,this.score.combo);
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
      this.toastAt('+1', x, 930*this.scale.height/1688, color);
      if(this.score.combo>=2)this.toastAt(`x${this.score.combo}`,x,955*this.scale.height/1688,color);
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
        const fly=this.add.graphics().setDepth(5);ball(fly,color,0,0,70,this.skin,this.elapsed/85,'dizzy');fly.setPosition(390,1000);this.tweens.add({targets:fly,y:570,alpha:0,duration:650,ease:'Cubic.Out',onComplete:()=>fly.destroy()});
      }
      else
        this.toast('TOO LATE');
    }
    this.gap = this.elapsed + this.difficulty().gapMs;
    if (result.tier)
      this.showTier(result.tier, color ?? this.laneNames[lane ?? 0]);
    if (result.gameOver && !this.def) {
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
        level:Math.floor(this.score.score/5)+1,levelProgress:(this.score.score%5)/5,skin:this.skin,unlockedSkins:getUnlockedSkins(),firstBallAt:this.firstBallAt,
      });
    }
    if(this.def&&!this.runResultSent){
      const stats:RunStats={correct:this.correctCount,combo:this.score.combo,bestCombo:this.bestCombo,streak:this.score.combo,wrong:this.wrongCount,missed:this.missCount,elapsedSec:this.elapsed/1000,livesLeft:this.score.lives};
      const progress=goalProgress(this.def,stats);this.goalCurrent=progress.current;
      if(progress.done||progress.failed){this.runResultSent=true;this.active=null;this.stateScene='over';this.publish();const won=progress.done;const stars=won?(this.runMode==='level'?starsFor(this.def,{livesLeft:this.score.lives,elapsedSec:this.elapsed/1000}):this.score.lives):0;if(won&&this.runMode==='level')trackLevelClear(this.levelId);if(!won)this.toast(progress.failReason==='time'?'TIME!':'OOPS');const outcome={mode:this.runMode,id:this.levelId,dateKey:this.dateKey,won,stars,progress:progress.current,target:progress.target,soClose:soCloseText(this.def,progress),elapsedMs:this.elapsed,score:this.score.score,lives:this.score.lives,totalStars:totalStars(),def:this.def};this.time.delayedCall(400,()=>this.scene.start('level-end',outcome));return;}
    }
  }
  private difficulty():ReturnType<typeof getDifficulty>{const d=getDifficulty(this.score.score);return this.def?{...d,travelMs:this.def.travelMs,gapMs:this.def.gapMs,colorsInPool:this.def.colorsInPool,band:1}:d;}
  private obj(name: string): Phaser.GameObjects.Text {
    return this.children.getByName(name) as Phaser.GameObjects.Text;
  }
  private toast(label: string): void {
    const item = text(this, 390, 820, label, 34, '#353431');
    this.tweens.add({ targets: item, alpha: 0, y: 780, duration: 850, delay: 350, onComplete: () => item.destroy() });
  }
  private toastAt(label: string, x: number, y: number, _color?: ColorName): void {
    const item = text(this, x, y, label, 38, '#353431');
    this.tweens.add({ targets: item, scale: 1.3, alpha: 0, y: y - 65, duration: 600, onComplete: () => item.destroy() });
  }
  private showTier(tier: Tier, color: ColorName): void {
    this.tierShown=tier;this.tierBursts++;
    this.tweens.add({targets:this.hint,alpha:0,duration:120});
    const size=tier==='FANTASTIC'?100:tier==='PERFECT'?88:tier==='GREAT'?76:64;
    const targets: Phaser.GameObjects.Text[] = tier==='FANTASTIC'
      ? [...tier].map((letter,index)=>this.add.text(390-261+index*58,520,letter,{fontFamily:'system-ui,sans-serif',fontSize:`${size}px`,fontStyle:'bold',color:'#ffffff',stroke:`#${[0xe98980,0xe9cd83,0x9ac9ac,0x85b9d8,0xb8a6d9][index%5].toString(16)}`,strokeThickness:10,shadow:{offsetX:0,offsetY:5,color:'#6f665b',blur:9,fill:true}}).setOrigin(.5).setScale(.05).setDepth(22))
      : [this.add.text(390,520,tier,{fontFamily:'system-ui,sans-serif',fontSize:`${size}px`,fontStyle:'bold',color:'#ffffff',stroke:`#${HEX[color].toString(16).padStart(6,'0')}`,strokeThickness:10,shadow:{offsetX:0,offsetY:5,color:'#6f665b',blur:9,fill:true},align:'center'}).setOrigin(.5).setScale(.05).setDepth(22)];
    this.tweens.add({
      targets,
      scale: 1.2, duration: 180, ease: 'Back.Out', yoyo: true, hold: 650,
      onComplete: () => { this.tweens.add({ targets, alpha: 0, y: 500, duration: 340, onComplete: () => targets.forEach(item=>item.destroy()) }); },
    });
    if(tier!=='GOOD'){this.particles(390,520,color);if(tier!=='GREAT')this.particles(390,520,color);}
    if(tier==='GREAT'||tier==='PERFECT'||tier==='FANTASTIC'){const ring=this.add.graphics().setPosition(390,520).setDepth(21);ring.lineStyle(tier==='FANTASTIC'?9:6,HEX[color],.9);ring.strokeCircle(0,0,48);this.tweens.add({targets:ring,scale:3.2,alpha:0,duration:500,onComplete:()=>ring.destroy()});}
    if(tier==='PERFECT'){this.cameras.main.zoomTo(1.035,120);this.time.delayedCall(180,()=>this.cameras.main.zoomTo(1,150));}
    if(tier==='FANTASTIC'){this.cameras.main.flash(110,255,250,235);this.vibrate(10,true);const confetti=this.add.graphics();const colors=[0xe98980,0x85b9d8,0x9ac9ac,0xe9cd83,0xb8a6d9];for(let i=0;i<44;i++){confetti.fillStyle(colors[i%5],1);confetti.fillRect(120+(i*47)%540,440+(i*71)%300,10,16);}this.tweens.add({targets:confetti,alpha:0,y:70,duration:750,onComplete:()=>confetti.destroy()});}
  }
  private levelRibbon():void {
    const c=this.add.container(390,650).setDepth(20).setScale(.2);const g=this.add.graphics();
    g.fillStyle(0xff8fab,1);g.fillPoints([{x:-230,y:-34},{x:-270,y:-62},{x:-255,y:-18},{x:-270,y:24},{x:-230,y:35}],true);g.fillPoints([{x:230,y:-34},{x:270,y:-62},{x:255,y:-18},{x:270,y:24},{x:230,y:35}],true);
    g.fillStyle(0xff8fab,1);g.fillRoundedRect(-235,-45,470,90,22);g.lineStyle(7,0xff6f9a,1);g.strokeRoundedRect(-235,-45,470,90,22);
    const label=this.add.text(0,0,'LEVEL UP!',{fontFamily:'system-ui,sans-serif',fontSize:'56px',fontStyle:'bold',color:'#ffffff',stroke:'#ff6f9a',strokeThickness:4}).setOrigin(.5);c.add([g,label]);
    this.tweens.add({targets:c,scale:1,duration:360,ease:'Back.Out',hold:700,onComplete:()=>this.tweens.add({targets:c,y:570,alpha:0,duration:420,onComplete:()=>c.destroy()})});
    for(let i=0;i<14;i++){const f=this.add.graphics().setDepth(21);const x=390+(Math.random()-.5)*380,y=650+(Math.random()-.5)*130;f.fillStyle([0xffd45e,0xb993f5,0x75c9f5][i%3],1);f.fillPoints([{x,y:y-9},{x:x+3,y:y-3},{x:x+9,y},{x:x+3,y:y+3},{x,y:y+9},{x:x-3,y:y+3},{x:x-9,y},{x:x-3,y:y-3}],true);this.tweens.add({targets:f,y:y-65,alpha:0,duration:700,delay:i*13,onComplete:()=>f.destroy()});}
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
    const difficulty = this.difficulty();
    const canvas = this.game.canvas.getBoundingClientRect();
    const buttons = this.lanes.map((button) => ({
      x: canvas.left + button.x / 780 * canvas.width,
      y: canvas.top + button.y / this.scale.height * canvas.height,
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
      layout: { hud: { top: 0, bottom: 250 }, play: { top: 250, bottom: 1320 }, controls: { top: 1400, bottom: 1620 }, hint: { x: 390, y: 1375, w: 500, h: 36, visible: this.hint.alpha > 0, alpha: this.hint.alpha } },
    };
    window.__COLORFACTORY__ = {
      getState: () => Object.freeze({
        ...state,
        mode:this.runMode,levelId:this.runMode==='endless'?null:this.levelId,goal:this.def?{type:this.def.goal,target:this.def.target,current:this.goalCurrent,remaining:Math.max(0,this.def.target-this.goalCurrent),timeLeftSec:this.def.timeLimitSec?Math.max(0,this.def.timeLimitSec-this.elapsed/1000):null,title:this.def.title}:null,
        totalStars:totalStars(),streak:currentStreak(localDateKey()),dateKey:this.dateKey,dailySeed:this.runMode==='daily'?dailyChallenge(this.dateKey).seed:null,
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
      this.scene.start('game',{mode:this.gameScene.runMode,id:this.gameScene.levelId,dateKey:this.gameScene.dateKey});
    }
    else {
      this.scene.stop();
      this.scene.stop('game');
      this.scene.start('menu');
    }
  }
}

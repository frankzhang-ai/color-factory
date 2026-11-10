import Phaser from 'phaser';
import { ball,text } from '../objects/draw.ts';
import { getLevel } from '../systems/Levels.ts';
import { dailyChallenge } from '../systems/Daily.ts';
import { localDateKey } from '../systems/Clock.ts';
import { getStars,totalStars } from '../systems/Progress.ts';
import { currentStreak } from '../systems/Daily.ts';

type Data={mode:'level'|'daily';id?:number;dateKey?:string};
export class GoalScene extends Phaser.Scene {
 constructor(){super('goal');}
 create(d:Data):void{
  const daily=d.mode==='daily',id=d.id??1,dateKey=d.dateKey??localDateKey(),def:any=daily?dailyChallenge(dateKey):getLevel(id)!;
  this.add.graphics().fillStyle(0xffffff,.55).fillRect(0,0,780,1688);const card=this.add.graphics();card.fillStyle(0xffffff,.98);card.fillRoundedRect(42,300,696,1000,48);card.lineStyle(6,0xffdce6,1);card.strokeRoundedRect(42,300,696,1000,48);
  text(this,390,380,daily?`DAILY CHALLENGE · ${dateKey}`:`LEVEL ${id}${def.boss?'  👑':''}`,32,'#59465b');if(def.boss)text(this,390,435,'BOSS!',24,'#e98980');
  const icon=this.add.graphics();ball(icon,'coral',390,565,68,'Classic');text(this,390,680,def.title,31,'#59465b');
  const details=`♥ ${def.lives} lives${def.timeLimitSec?`   ·   ⏱ ${def.timeLimitSec}s`:''}   ·   ${def.colorsInPool} colours`;text(this,390,760,details,21,'#77746d','normal');
  text(this,390,840,def.starRule==='lives'?'3★: no mistakes':`3★: under ${def.parSec}s`,21,'#b38d35');text(this,390,900,`BEST  ${daily?'—':`${getStars(id)} ★`}`,21,'#77746d');if(daily)text(this,390,950,`🔥  ${currentStreak(localDateKey())} day streak`,20,'#e98955');
  const play=this.add.graphics();play.fillStyle(0xff8fab,1);play.fillRoundedRect(140,1080,500,120,34);play.setInteractive(new Phaser.Geom.Rectangle(140,1080,500,120),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('game',daily?{mode:'daily',dateKey}:{mode:'level',id}));text(this,390,1140,'PLAY',39,'#ffffff');
  const close=this.add.graphics();close.fillStyle(0xf7edf1,1);close.fillCircle(685,340,32);close.setInteractive(new Phaser.Geom.Circle(685,340,32),Phaser.Geom.Circle.Contains).on('pointerdown',()=>this.scene.start('menu'));text(this,685,340,'×',33,'#59465b');
  const rect=this.game.canvas.getBoundingClientRect(),sx=rect.width/780,sy=rect.height/this.scale.height;const point=(x:number,y:number)=>({x:rect.left+x*sx,y:rect.top+y*sy});(window as any).__COLORFACTORY__={...window.__COLORFACTORY__,getState:()=>Object.freeze({scene:'goal',mode:daily?'daily':'level',levelId:id,goal:{type:def.goal,target:def.target,current:0,remaining:def.target,timeLeftSec:def.timeLimitSec,title:def.title},stars:null,totalStars:totalStars(),streak:currentStreak(localDateKey()),dateKey,dailySeed:daily?def.seed:null,goalCard:{play:point(390,1140),close:point(685,340)}})};
 }
}
